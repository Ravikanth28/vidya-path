import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertTriangle, Video, VideoOff, Mic, MicOff, Eye, Clock, X, CheckCircle, XCircle, Play, Send, Lightbulb, Code, Smartphone, Database, Layers, Shield, Users, BarChart3, BookOpen } from 'lucide-react'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import socketService from '../services/socketService'
import SQLValidator from './SQLValidator'
import SQLVisualizer from './SQLVisualizer'
import SQLDebugger from './SQLDebugger'

// TensorFlow.js modules loaded dynamically to reduce initial bundle size (~5MB)
let tf = null
let cocoSsd = null
let blazeface = null

const loadTFModules = async () => {
    if (!tf) {
        const [tfModule, cocoModule, blazeModule] = await Promise.all([
            import('@tensorflow/tfjs'),
            import('@tensorflow-models/coco-ssd'),
            import('@tensorflow-models/blazeface')
        ])
        tf = tfModule
        cocoSsd = cocoModule
        blazeface = blazeModule
    }
    return { tf, cocoSsd, blazeface }
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

// Language configurations
const LANGUAGE_CONFIG = {
    'Python': { monacoLang: 'python', ext: '.py', defaultCode: `# Write your Python code here\n\ndef solution():\n    pass\n\n# Call your solution\nsolution()` },
    'JavaScript': { monacoLang: 'javascript', ext: '.js', defaultCode: `// Write your JavaScript code here\n\nfunction solution() {\n    \n}\n\n// Call your solution\nsolution();` },
    'Java': { monacoLang: 'java', ext: '.java', defaultCode: `// Write your Java code here\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}` },
    'C': { monacoLang: 'c', ext: '.c', defaultCode: `// Write your C code here\n#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}` },
    'C++': { monacoLang: 'cpp', ext: '.cpp', defaultCode: `// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}` },
    'SQL': { monacoLang: 'sql', ext: '.sql', defaultCode: `-- Write your SQL query here\nSELECT * FROM table_name;` }
}

function ProctoredCodeEditor({ problem, user, onClose, onSubmitSuccess }) {
    const [selectedLanguage, setSelectedLanguage] = useState(problem.language)
    const [code, setCode] = useState(LANGUAGE_CONFIG[problem.language]?.defaultCode || '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [output, setOutput] = useState([]) // [{text, type: 'stdout'|'stderr'|'info'|'stdin'}]
    const [hint, setHint] = useState('')
    const [loadingHint, setLoadingHint] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [customInput, setCustomInput] = useState(problem.sampleInput || '')
    const [activeOutputTab, setActiveOutputTab] = useState('output')
    const [testCases, setTestCases] = useState([])
    const [testResults, setTestResults] = useState([])
    const [runningTests, setRunningTests] = useState(false)
    const [sqlTool, setSqlTool] = useState('validator')
    const [descTab, setDescTab] = useState('description')
    const [runResult, setRunResult] = useState(null)  // { actual, expected, passed }
    const [interactiveStdin, setInteractiveStdin] = useState('')
    const [terminalSize, setTerminalSize] = useState('normal') // 'minimized' | 'normal' | 'maximized'
    const terminalRef = useRef(null)
    const containerRef = useRef(null)

    const isSQLProblem = problem.type === 'SQL' || problem.language === 'SQL'

    // Proctoring state
    const [tabSwitches, setTabSwitches] = useState(0)
    const [copyPasteAttempts, setCopyPasteAttempts] = useState(0)
    const [showWarning, setShowWarning] = useState(false)
    const [warningMessage, setWarningMessage] = useState('')
    const [isDisqualified, setIsDisqualified] = useState(false)
    const [startTime] = useState(Date.now())
    const [result, setResult] = useState(null)

    // Video/Audio state
    const [videoEnabled, setVideoEnabled] = useState(false)
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [mediaStream, setMediaStream] = useState(null)
    const [cameraBlocked, setCameraBlocked] = useState(false)
    const [cameraBlockedCount, setCameraBlockedCount] = useState(0)
    const [phoneDetected, setPhoneDetected] = useState(false)
    const [phoneDetectionCount, setPhoneDetectionCount] = useState(0)
    const [modelLoaded, setModelLoaded] = useState(false)

    // Face Detection state (NEW - BlazeFace)
    const [faceDetected, setFaceDetected] = useState(true)
    const [multipleFaces, setMultipleFaces] = useState(false)
    const [faceLookawayCount, setFaceLookawayCount] = useState(0)
    const [faceNotDetectedCount, setFaceNotDetectedCount] = useState(0)
    const [multipleFacesDetectionCount, setMultipleFacesDetectionCount] = useState(0)

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const cameraCheckIntervalRef = useRef(null)
    const cameraBlockedRef = useRef(false)
    const phoneDetectedRef = useRef(false)
    const objectDetectorRef = useRef(null)
    const phoneCheckIntervalRef = useRef(null)

    // Face Detection refs (NEW - BlazeFace)
    const faceDetectorRef = useRef(null)
    const faceCheckIntervalRef = useRef(null)
    const faceDetectedRef = useRef(true)

    const proctoring = problem.proctoring || {}
    const maxTabSwitches = proctoring.maxTabSwitches || 3

    // Request fullscreen on mount
    useEffect(() => {
        const requestFullscreen = () => {
            if (containerRef.current && !document.fullscreenElement) {
                containerRef.current.requestFullscreen().then(() => {
                    setIsFullscreen(true)
                }).catch(err => {
                    console.log('Fullscreen request failed:', err.message)
                })
            }
        }

        // Request fullscreen after a short delay to ensure DOM is ready
        setTimeout(requestFullscreen, 100)

        // Handle fullscreen changes
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)

        // Load test cases
        if (problem.testCases) {
            const cases = typeof problem.testCases === 'string' ? JSON.parse(problem.testCases) : problem.testCases
            setTestCases(Array.isArray(cases) ? cases : [])
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            // Exit fullscreen when closing
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { })
            }
        }
    }, [])

    // Initialize video/audio if enabled
    useEffect(() => {
        if (proctoring.enabled && proctoring.videoAudio) {
            initializeMedia()
        }
        return () => {
            stopCameraCheck()
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const initializeMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true
            })
            setMediaStream(stream)
            setVideoEnabled(true)
            setAudioEnabled(true)
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            // Start camera obstruction detection
            startCameraCheck()
            // Load AI model for phone detection
            loadObjectDetectionModel()
            // Load AI model for face detection (NEW - BlazeFace) - only if face detection is enabled
            if (proctoring.enableFaceDetection || proctoring.detectMultipleFaces || proctoring.trackFaceLookaway) {
                loadFaceDetectionModel()
            }
        } catch (err) {
            console.error('Failed to access camera/microphone:', err)
            setWarningMessage('⚠️ Camera/Microphone access required for proctoring')
            setShowWarning(true)
        }
    }

    const stopAllMedia = () => {
        // Stop camera obstruction detection
        stopCameraCheck()
        // Stop phone detection
        stopPhoneDetection()
        // Stop face detection (NEW - BlazeFace)
        stopFaceDetection()
        // Stop all media tracks (camera + microphone)
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => {
                track.stop()
                console.log(`🛑 Stopped ${track.kind} track`)
            })
            setMediaStream(null)
        }
        // Clear video element
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setVideoEnabled(false)
        setAudioEnabled(false)
    }

    const handleClose = () => {
        stopAllMedia()
        onClose()
    }

    // Camera obstruction detection - checks if camera is blocked/covered
    const startCameraCheck = () => {
        // Create a hidden canvas for frame analysis
        const canvas = document.createElement('canvas')
        canvas.width = 64  // Small size for performance
        canvas.height = 48
        canvasRef.current = canvas

        // Check every 3 seconds
        cameraCheckIntervalRef.current = setInterval(() => {
            checkCameraObstruction()
        }, 3000)
    }

    const stopCameraCheck = () => {
        if (cameraCheckIntervalRef.current) {
            clearInterval(cameraCheckIntervalRef.current)
            cameraCheckIntervalRef.current = null
        }
    }

    const checkCameraObstruction = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data

        // Analyze brightness and variance
        let totalBrightness = 0
        let darkPixels = 0
        let colorSum = { r: 0, g: 0, b: 0 }
        const totalPixels = pixels.length / 4

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            colorSum.r += r
            colorSum.g += g
            colorSum.b += b

            // Count very dark pixels (brightness < 30)
            if (brightness < 30) {
                darkPixels++
            }
        }

        const avgBrightness = totalBrightness / totalPixels
        const darkRatio = darkPixels / totalPixels
        const avgColor = {
            r: colorSum.r / totalPixels,
            g: colorSum.g / totalPixels,
            b: colorSum.b / totalPixels
        }

        // Calculate color variance (how different pixels are from average)
        let variance = 0
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            variance += Math.abs(r - avgColor.r) + Math.abs(g - avgColor.g) + Math.abs(b - avgColor.b)
        }
        variance = variance / totalPixels / 3

        // Camera is blocked if:
        // 1. More than 90% of pixels are very dark (covered with dark material), OR
        // 2. Average brightness is very low (< 15), OR
        // 3. Very low variance (< 8) means uniform color = shutter/cover/tape
        const isBlocked = darkRatio > 0.90 || avgBrightness < 15 || variance < 8

        console.log(`Camera check - Brightness: ${avgBrightness.toFixed(1)}, Variance: ${variance.toFixed(1)}, Dark%: ${(darkRatio * 100).toFixed(1)}%, Blocked: ${isBlocked}`)

        if (isBlocked && !cameraBlockedRef.current) {
            cameraBlockedRef.current = true
            setCameraBlocked(true)
            setCameraBlockedCount(prev => {
                const newCount = prev + 1

                // 📊 EMIT: Camera blocked violation
                socketService.emitProctoringViolation(
                    user.id,
                    user.name || user.email,
                    'camera_blocked',
                    'critical',
                    problem.mentorId
                )

                setWarningMessage(`🚫 Camera obstruction detected! (${newCount} times) Please uncover your camera.`)
                setShowWarning(true)
                return newCount
            })
        } else if (!isBlocked && cameraBlockedRef.current) {
            cameraBlockedRef.current = false
            setCameraBlocked(false)
            setShowWarning(false)
        }
    }

    // Phone/Object detection using TensorFlow.js COCO-SSD
    const loadObjectDetectionModel = async () => {
        try {
            console.log('📱 Loading object detection model...')
            const { tf: tfLib, cocoSsd: cocoLib } = await loadTFModules()
            await tfLib.ready()
            const model = await cocoLib.load({ base: 'lite_mobilenet_v2' })
            objectDetectorRef.current = model
            setModelLoaded(true)
            console.log('✅ Object detection model loaded')
            // Start phone detection after model loads
            startPhoneDetection()
        } catch (err) {
            console.error('Failed to load object detection model:', err)
        }
    }

    const startPhoneDetection = () => {
        // Check every 2 seconds for phones
        phoneCheckIntervalRef.current = setInterval(() => {
            detectPhone()
        }, 2000)
    }

    const stopPhoneDetection = () => {
        if (phoneCheckIntervalRef.current) {
            clearInterval(phoneCheckIntervalRef.current)
            phoneCheckIntervalRef.current = null
        }
    }

    const detectPhone = async () => {
        if (!videoRef.current || !objectDetectorRef.current) {
            console.log('⏳ Phone detection skipped - video or model not ready')
            return
        }

        // Check if video is actually playing
        if (videoRef.current.readyState < 2) {
            console.log('⏳ Video not ready yet, readyState:', videoRef.current.readyState)
            return
        }

        try {
            const predictions = await objectDetectorRef.current.detect(videoRef.current)

            console.log('🔍 Detection ran, found:', predictions.length, 'objects:', predictions.map(p => `${p.class}(${(p.score * 100).toFixed(0)}%)`).join(', '))

            // Check for cell phone, laptop, book, or remote (potential cheating devices)
            const suspiciousObjects = predictions.filter(p =>
                ['cell phone', 'laptop', 'book', 'remote'].includes(p.class) &&
                p.score > 0.4  // Lower threshold to 40% for better detection
            )

            const phoneFound = suspiciousObjects.some(p => p.class === 'cell phone' && p.score > 0.4)

            if (suspiciousObjects.length > 0) {
                console.log('🚨 Suspicious objects detected:', suspiciousObjects.map(p => `${p.class} (${(p.score * 100).toFixed(0)}%)`))
            }

            if (phoneFound && !phoneDetectedRef.current) {
                phoneDetectedRef.current = true
                setPhoneDetected(true)
                setPhoneDetectionCount(prev => {
                    const newCount = prev + 1

                    // 📊 EMIT: Phone detected violation
                    socketService.emitProctoringViolation(
                        user.id,
                        user.name || user.email,
                        'phone_detected',
                        newCount > 2 ? 'critical' : 'warning',
                        problem.mentorId
                    )

                    setWarningMessage(`📱 Mobile phone detected! (${newCount} times) Remove all electronic devices from view.`)
                    setShowWarning(true)
                    return newCount
                })
            } else if (!phoneFound && phoneDetectedRef.current) {
                phoneDetectedRef.current = false
                setPhoneDetected(false)
                // Don't hide warning immediately, let it fade
                setTimeout(() => {
                    if (!phoneDetectedRef.current && !cameraBlockedRef.current) {
                        setShowWarning(false)
                    }
                }, 3000)
            }
        } catch (err) {
            console.error('Phone detection error:', err)
        }
    }

    // ============ FACE DETECTION (BlazeFace) ============

    // Load BlazeFace model for face detection
    const loadFaceDetectionModel = async () => {
        try {
            console.log('👁️ Loading BlazeFace model...')
            const { blazeface: blazeLib } = await loadTFModules()
            const detector = await blazeLib.load()
            faceDetectorRef.current = detector
            console.log('✅ BlazeFace model loaded successfully')
            startFaceDetection()
        } catch (error) {
            console.error('❌ Failed to load BlazeFace model:', error)
        }
    }

    // Detect if student is looking away from screen (using face coordinates)
    const isLookingAway = (prediction) => {
        if (!prediction || !prediction.start || !prediction.end) return false

        // Get face position
        const [faceX1, faceY1] = prediction.start
        const [faceX2, faceY2] = prediction.end
        const faceCenterX = (faceX1 + faceX2) / 2
        const faceCenterY = (faceY1 + faceY2) / 2

        // Video center
        const videoCenterX = videoRef.current.videoWidth / 2
        const videoCenterY = videoRef.current.videoHeight / 2

        // Calculate deviation from center
        const horizontalDeviation = Math.abs(faceCenterX - videoCenterX)
        const verticalDeviation = Math.abs(faceCenterY - videoCenterY)

        // If face is off-center, student is looking away
        const DEVIATION_THRESHOLD = 150
        const isAway = horizontalDeviation > DEVIATION_THRESHOLD || verticalDeviation > DEVIATION_THRESHOLD

        return isAway
    }

    // Detect face in video stream
    const detectFace = async () => {
        if (!videoRef.current || !faceDetectorRef.current) return

        try {
            const predictions = await faceDetectorRef.current.estimateFaces(
                videoRef.current,
                false  // returnTensors = false
            )

            console.log(`👁️ Face detection result: ${predictions.length} face(s)`)

            // Check face detection status
            if (predictions.length === 0) {
                // Face not detected
                if (proctoring.enableFaceDetection) {
                    setFaceDetected(false)
                    setFaceNotDetectedCount(prev => {
                        // 📊 EMIT: Face not detected violation
                        socketService.emitProctoringViolation(
                            user.id,
                            user.name || user.email,
                            'face_not_detected',
                            'warning',
                            problem.mentorId
                        )
                        return prev + 1
                    })
                    console.log('⚠️ Face not detected')
                }
            } else if (predictions.length === 1) {
                // Single face detected - GOOD
                setFaceDetected(true)
                setMultipleFaces(false)
                console.log('✅ Single face detected')

                // Check if student is looking away (only if trackFaceLookaway is enabled)
                if (proctoring.trackFaceLookaway && isLookingAway(predictions[0])) {
                    setFaceLookawayCount(prev => {
                        // 📊 EMIT: Face lookaway violation
                        socketService.emitProctoringViolation(
                            user.id,
                            user.name || user.email,
                            'face_lookaway',
                            'warning',
                            problem.mentorId
                        )
                        return prev + 1
                    })
                    console.log('⚠️ Face is off-center (looking away)')
                }
            } else if (predictions.length >= 2) {
                // Multiple faces detected - CHEATING (only if detectMultipleFaces is enabled)
                if (proctoring.detectMultipleFaces) {
                    setFaceDetected(true)
                    setMultipleFaces(true)
                    setMultipleFacesDetectionCount(prev => {
                        // 📊 EMIT: Multiple faces detected (critical violation)
                        socketService.emitProctoringViolation(
                            user.id,
                            user.name || user.email,
                            'multiple_faces',
                            'critical',
                            problem.mentorId
                        )
                        return prev + 1
                    })
                    setWarningMessage(`👥 Multiple people detected! (${predictions.length} faces) - Automatic violation!`)
                    setShowWarning(true)
                    console.log('🚨 Multiple faces detected - CHEATING')
                }
            }
        } catch (error) {
            console.error('❌ Face detection inference failed:', error)
            setFaceDetected(false)
        }
    }

    // Start periodic face detection
    const startFaceDetection = () => {
        if (!faceDetectorRef.current) {
            console.error('❌ Face detector not loaded yet')
            return
        }

        // Run face detection every 1 second
        faceCheckIntervalRef.current = setInterval(() => {
            detectFace()
        }, 1000)

        console.log('👁️ Face detection started (1s intervals)')
    }

    // Stop face detection
    const stopFaceDetection = () => {
        if (faceCheckIntervalRef.current) {
            clearInterval(faceCheckIntervalRef.current)
            faceCheckIntervalRef.current = null
            console.log('👁️ Face detection stopped')
        }
    }

    // Tab switch detection and fullscreen re-request
    useEffect(() => {
        if (!proctoring.enabled || !proctoring.trackTabSwitches) return

        const handleVisibilityChange = () => {
            if (document.hidden && !isDisqualified) {
                setTabSwitches(prev => {
                    const newCount = prev + 1

                    // 📊 EMIT: Window/Tab switch violation
                    socketService.emitProctoringViolation(
                        user.id,
                        user.name || user.email,
                        'window_switch',
                        newCount >= maxTabSwitches ? 'critical' : 'warning',
                        problem.mentorId
                    )

                    if (newCount >= maxTabSwitches) {
                        setWarningMessage(`🚫 Maximum tab switches reached (${newCount}/${maxTabSwitches}). This will be reported.`)
                        setShowWarning(true)
                        setIsDisqualified(true)
                    } else {
                        setWarningMessage(`⚠️ Tab switch detected! (${newCount}/${maxTabSwitches}) ${maxTabSwitches - newCount} more will be flagged!`)
                        setShowWarning(true)
                        setTimeout(() => setShowWarning(false), 4000)
                    }

                    return newCount
                })
            } else if (!document.hidden) {
                // When returning to tab, re-request fullscreen
                if (containerRef.current && !document.fullscreenElement) {
                    setTimeout(() => {
                        containerRef.current?.requestFullscreen().catch(() => { })
                    }, 100)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [proctoring, isDisqualified, maxTabSwitches])

    // Disable copy/paste
    useEffect(() => {
        if (!proctoring.enabled || !proctoring.disableCopyPaste) return

        const handleCopyPaste = (e) => {
            if (e.type === 'paste' || (e.ctrlKey && (e.key === 'v' || e.key === 'c'))) {
                e.preventDefault()
                setCopyPasteAttempts(prev => {
                    // 📊 EMIT: Copy/Paste attempt violation
                    socketService.emitProctoringViolation(
                        user.id,
                        user.name || user.email,
                        'copy_attempt',
                        'warning',
                        problem.mentorId
                    )
                    return prev + 1
                })
                setWarningMessage('🚫 Copy/Paste is disabled for this problem!')
                setShowWarning(true)
                setTimeout(() => setShowWarning(false), 3000)
            }
        }

        const handleContextMenu = (e) => {
            e.preventDefault()
        }

        document.addEventListener('paste', handleCopyPaste)
        document.addEventListener('keydown', handleCopyPaste)
        document.addEventListener('contextmenu', handleContextMenu)

        return () => {
            document.removeEventListener('paste', handleCopyPaste)
            document.removeEventListener('keydown', handleCopyPaste)
            document.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [proctoring])

    const normalizeForCompare = s => (s || '').trim().replace(/\s+/g, ' ')

    const handleRun = () => {
        setIsRunning(true)
        setOutput([])
        setRunResult(null)
        setInteractiveStdin('')
        setActiveOutputTab('output')

        const socket = socketService.connect()
        socket.emit('run-interactive', {
            code,
            language: selectedLanguage,
            problemId: problem.id,
            sqlSchema: problem.sqlSchema
        })

        let accOutput = ''

        const onOutput = ({ text, type }) => {
            if (type !== 'stdin') accOutput += text
            setOutput(prev => [...prev, { text, type: type || 'stdout' }])
            // Auto-scroll terminal to bottom
            setTimeout(() => {
                if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
            }, 0)
        }

        const onExit = ({ code: exitCode, allOutput: progOutput }) => {
            socket.off('run-output', onOutput)
            socket.off('run-exit', onExit)
            setIsRunning(false)
            // Use allOutput from server — it's pure program output, excludes "Compiling..." status messages
            const progText = (progOutput !== undefined ? progOutput : accOutput)
            const expectedRaw = (problem.expectedOutput || problem.expected_output || '').trim()
            if (expectedRaw) {
                const passed = normalizeForCompare(progText) === normalizeForCompare(expectedRaw)
                setRunResult({ actual: progText.trim(), expected: expectedRaw, passed })
            }
        }

        socket.on('run-output', onOutput)
        socket.on('run-exit', onExit)
    }

    const sendInteractiveStdin = () => {
        const socket = socketService.connect()
        socket.emit('run-stdin', interactiveStdin)
        // Echo stdin as a green segment so user knows what they typed
        setOutput(prev => [...prev, { text: interactiveStdin + '\n', type: 'stdin' }])
        setInteractiveStdin('')
    }

    const stopRun = () => {
        const socket = socketService.connect()
        socket.emit('kill-run')
    }

    const handleGetHint = async () => {
        setLoadingHint(true)
        try {
            const res = await axios.post(`${API_BASE}/hints`, {
                problemDescription: problem.description,
                currentCode: code,
                language: selectedLanguage
            })
            setHint(res.data.hint)
        } catch (err) {
            setHint('Unable to generate hint at this time.')
        } finally {
            setLoadingHint(false)
        }
    }

    const handleRunAllTests = async () => {
        if (!testCases || testCases.length === 0) {
            alert('No test cases available for this problem')
            return
        }

        setRunningTests(true)
        setTestResults([])

        try {
            const results = []

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i]
                try {
                    const res = await axios.post(`${API_BASE}/run`, {
                        code,
                        language: selectedLanguage,
                        problemId: problem.id,
                        sqlSchema: problem.sqlSchema,
                        stdin: testCase.input || testCase.stdin || ''
                    })

                    const expectedOutput = (testCase.expectedOutput || testCase.expected_output || '').trim()
                    const actualOutput = (res.data.output || '').trim()
                    const passed = actualOutput === expectedOutput && !res.data.error

                    results.push({
                        testNumber: i + 1,
                        input: testCase.input || testCase.stdin || 'N/A',
                        expected: expectedOutput,
                        actual: actualOutput,
                        passed,
                        error: res.data.error || null
                    })
                } catch (err) {
                    results.push({
                        testNumber: i + 1,
                        input: testCase.input || testCase.stdin || 'N/A',
                        expected: testCase.expectedOutput || testCase.expected_output || 'N/A',
                        actual: 'ERROR',
                        passed: false,
                        error: err.response?.data?.error || err.message
                    })
                }
            }

            setTestResults(results)
            setActiveOutputTab('tests')

            // Check if all passed
            const allPassed = results.every(r => r.passed)
            if (allPassed) {
                socketService.emitTestSuccess(
                    user.id,
                    user.name || user.email,
                    problem.id,
                    `All ${results.length} tests passed - ${problem.title}`,
                    problem.mentorId
                )
            }
        } catch (err) {
            alert('Error running tests: ' + err.message)
        } finally {
            setRunningTests(false)
        }
    }

    const handleSubmit = async () => {
        if (!code.trim()) {
            alert('Please write some code before submitting')
            return
        }

        setIsSubmitting(true)
        const timeSpent = Math.round((Date.now() - startTime) / 1000)

        // 📊 EMIT: Submission started event
        socketService.emitSubmissionStarted(
            user.id,
            user.name || user.email,
            problem.id,
            problem.title,
            problem.mentorId,
            proctoring.enabled || false
        )

        try {
            const response = await axios.post(`${API_BASE}/submissions/proctored`, {
                studentId: user.id,
                problemId: problem.id,
                code,
                language: selectedLanguage,
                submissionType: 'editor',
                tabSwitches,
                copyPasteAttempts,
                cameraBlockedCount,
                phoneDetectionCount,
                // Face Detection Metrics (NEW - BlazeFace)
                faceNotDetectedCount,
                multipleFacesDetectionCount,
                faceLookawayCount,
                timeSpent,
                proctored: proctoring.enabled
            })

            // 📊 EMIT: Submission completed event
            socketService.emitSubmissionCompleted(
                user.id,
                user.name || user.email,
                problem.id,
                problem.title,
                problem.mentorId,
                response.data?.status || 'success',
                response.data?.score || 100
            )

            // Stop all media (camera, microphone, recording)
            stopAllMedia()

            if (onSubmitSuccess) {
                onSubmitSuccess(response.data)
            }
            setResult(response.data)
            // onClose() - Don't close immediately, show result first
        } catch (err) {
            // 📊 EMIT: Submission failed event
            socketService.emitSubmissionCompleted(
                user.id,
                user.name || user.email,
                problem.id,
                problem.title,
                problem.mentorId,
                'error',
                0
            )

            console.error('Submission error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            })

            const errorDetails = err.response?.data?.details || err.response?.data?.error || err.message
            const errorMsg = `Submission failed: ${errorDetails}. Please check your code and try again.`
            alert(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0f172a', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
            {/* Warning Toast */}
            {showWarning && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: isDisqualified ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', zIndex: 10001, boxShadow: '0 10px 40px rgba(239, 68, 68, 0.5)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontWeight: 600 }}>{warningMessage}</span>
                </div>
            )}

            {/* Header */}
            <div style={{ borderBottom: '1px solid #334155', background: '#1e293b', padding: '1rem 2rem', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {problem.title}
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '2rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
                                🔒 PROCTORED MODE
                            </span>
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{problem.type || 'Coding'}</span>
                            <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty?.toUpperCase()}</span>
                            {tabSwitches > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>⚠️ {tabSwitches} violations</span>}
                            {copyPasteAttempts > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>📋 {copyPasteAttempts} copy attempts</span>}
                            {cameraBlockedCount > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>📹 {cameraBlockedCount} cam blocks</span>}
                            {phoneDetectionCount > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>📱 {phoneDetectionCount} phone detected</span>}
                            {faceNotDetectedCount > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>👤 {faceNotDetectedCount} face missing</span>}
                            {multipleFacesDetectionCount > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>👥 {multipleFacesDetectionCount} multi-face</span>}
                            {faceLookawayCount > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>👀 {faceLookawayCount} lookaway</span>}
                        </div>
                    </div>
                </div>

                {/* Camera/Mic Status Indicators */}
                {proctoring.videoAudio && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                        <div style={{
                            padding: '0.4rem',
                            borderRadius: '6px',
                            background: cameraBlocked ? 'rgba(239, 68, 68, 0.2)' : (videoEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                            border: `1px solid ${cameraBlocked ? '#ef4444' : (videoEnabled ? '#10b981' : '#ef4444')}`
                        }}>
                            {cameraBlocked ? <VideoOff size={16} color="#ef4444" /> : (videoEnabled ? <Video size={16} color="#10b981" /> : <VideoOff size={16} color="#ef4444" />)}
                        </div>
                        <div style={{
                            padding: '0.4rem',
                            borderRadius: '6px',
                            background: audioEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            border: `1px solid ${audioEnabled ? '#10b981' : '#ef4444'}`
                        }}>
                            {audioEnabled ? <Mic size={16} color="#10b981" /> : <MicOff size={16} color="#ef4444" />}
                        </div>
                    </div>
                )}

                <button onClick={handleClose} style={{ background: '#334155', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Exit Session</button>
            </div>

            {/* Body */}
            {result ? (
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#0f172a', color: '#f8fafc' }}>
                    {/* Header Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #334155' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: `conic-gradient(${result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444'} ${result.score * 3.6}deg, #1e293b 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', flexShrink: 0
                        }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc' }}>{result.score}</span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, color: result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444', fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                                {result.score >= 90 ? 'Outstanding Performance!' : result.score >= 80 ? 'Excellent Work!' : result.score >= 60 ? 'Good Effort' : 'Needs Improvement'}
                            </h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                {result.feedback || (result.status === 'accepted' ? 'Your solution passed all tests and met the requirements.' : 'Your solution needs some improvements.')}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                {tabSwitches > 0 && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.85rem' }}>⚠️ {tabSwitches} tab switches</span>}
                                {copyPasteAttempts > 0 && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.85rem' }}>📋 {copyPasteAttempts} copy attempts</span>}
                                {cameraBlockedCount > 0 && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.85rem' }}>📹 {cameraBlockedCount} cam blocks</span>}
                                {phoneDetectionCount > 0 && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.85rem' }}>📱 {phoneDetectionCount} phone detected</span>}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    {result.analysis && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <BarChart3 size={20} color="#3b82f6" /> Performance Analysis
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                                {Object.entries(result.analysis).map(([key, val]) => {
                                    if (val === 'Unknown' || val === null) return null;

                                    const label = key.replace(/([A-Z])/g, ' $1').trim();
                                    const numericVal = parseInt(val);
                                    const isNumeric = !isNaN(numericVal);
                                    const score = isNumeric ? numericVal : 0;

                                    return (
                                        <div key={key} style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'capitalize', fontWeight: 600 }}>{label}</span>
                                                <span style={{ fontWeight: 800, color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444', fontSize: '1.1rem' }}>
                                                    {isNumeric ? `${score}%` : 'N/A'}
                                                </span>
                                            </div>
                                            {isNumeric ? (
                                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${Math.min(100, score)}%`,
                                                        height: '100%',
                                                        background: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
                                                        borderRadius: '4px',
                                                        transition: 'width 1s ease-out'
                                                    }} />
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                                                    {val}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Detailed Feedback / Explanation */}
                    {result.aiExplanation && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <BookOpen size={20} color="#8b5cf6" /> Detailed AI Analysis
                            </h4>
                            <div style={{
                                background: '#1e293b',
                                padding: '1.75rem',
                                borderRadius: '1rem',
                                border: '1px solid #334155',
                                color: '#cbd5e1',
                                fontSize: '1rem',
                                lineHeight: '1.8',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace'
                            }}>
                                {result.aiExplanation}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button onClick={handleClose} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            Close Session
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ padding: 0, display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, overflow: 'hidden', background: '#0f172a' }}>
                    {/* Left Side: LeetCode-style Problem Panel */}
                    <div style={{ width: '420px', borderRight: '1px solid #1e293b', overflowY: 'auto', background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                        {/* Tab bar */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0a0f1a', flexShrink: 0 }}>
                            {['description', 'examples', 'hints'].map(tab => (
                                <button key={tab} onClick={() => setDescTab(tab)} style={{ padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: descTab === tab ? '#60a5fa' : '#64748b', borderBottom: descTab === tab ? '2px solid #3b82f6' : '2px solid transparent', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                                    {tab === 'description' ? '📄 Description' : tab === 'examples' ? '📋 Examples' : '💡 Hints'}
                                </button>
                            ))}
                        </div>

                        {/* Description Tab */}
                        {descTab === 'description' && (() => {
                            // Smart description renderer — detects section headers & formats nicely
                            const SECTION_PATTERNS = /^(input format|output format|constraints?|examples?|explanation|note|notes|sample input|sample output|approach|hint|hints?|format|scoring|warning|important|problem statement)(s)?\s*:?\s*$/i
                            const lines = (problem.description || '').split('\n')
                            const rendered = []
                            let paraLines = []
                            const flushPara = () => {
                                if (paraLines.length) {
                                    const text = paraLines.join('\n').trim()
                                    if (text) rendered.push({ type: 'para', text })
                                    paraLines = []
                                }
                            }
                            lines.forEach((raw, i) => {
                                const line = raw.trimEnd()
                                if (SECTION_PATTERNS.test(line.trim())) {
                                    flushPara()
                                    rendered.push({ type: 'section', text: line.trim() })
                                } else if (line.trim() === '') {
                                    flushPara()
                                } else {
                                    paraLines.push(line)
                                }
                            })
                            flushPara()
                            return (
                            <div style={{ padding: '1.5rem', flex: 1 }}>
                                {/* Title + badges */}
                                <div style={{ marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid #1e293b' }}>
                                    <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{problem.title}</h2>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: problem.difficulty === 'Easy' ? 'rgba(34,197,94,0.15)' : problem.difficulty === 'Hard' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: problem.difficulty === 'Easy' ? '#4ade80' : problem.difficulty === 'Hard' ? '#f87171' : '#facc15', border: `1px solid ${problem.difficulty === 'Easy' ? 'rgba(34,197,94,0.3)' : problem.difficulty === 'Hard' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}` }}>{problem.difficulty?.toUpperCase() || 'MEDIUM'}</span>
                                        {problem.type && <span style={{ padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>{problem.type}</span>}
                                        {problem.language && problem.type !== problem.language && <span style={{ padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' }}>{problem.language}</span>}
                                    </div>
                                </div>

                                {/* Smart-rendered description */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    {rendered.map((block, i) => block.type === 'section' ? (
                                        <div key={i} style={{ marginTop: i === 0 ? 0 : '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#3b82f6', flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{block.text.replace(/:$/, '')}</span>
                                        </div>
                                    ) : (
                                        <p key={i} style={{ margin: '0 0 0.75rem', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{block.text}</p>
                                    ))}
                                </div>

                                {/* SQL schema */}
                                {isSQLProblem && problem.sqlSchema && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={12} /> Database Schema</div>
                                        <pre style={{ margin: 0, padding: '14px 16px', background: '#0d1929', border: '1px solid #1e3a5f', borderRadius: '10px', color: '#93c5fd', fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{problem.sqlSchema}</pre>
                                    </div>
                                )}

                                {/* Constraints */}
                                {problem.constraints && (
                                    <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Constraints</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{problem.constraints}</div>
                                    </div>
                                )}

                                {/* Tags */}
                                {problem.tags && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                                        {(typeof problem.tags === 'string' ? problem.tags.split(',') : problem.tags).filter(Boolean).map((tag, i) => (
                                            <span key={i} style={{ padding: '2px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '999px', color: '#64748b', fontSize: '0.7rem' }}>{tag.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            )
                        })()}

                        {/* Examples Tab */}
                        {descTab === 'examples' && (
                            <div style={{ padding: '1.5rem', flex: 1 }}>
                                {isSQLProblem ? (
                                    <>
                                        {problem.sqlSchema && (
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>📦 Database Schema (Input)</div>
                                                <pre style={{ margin: 0, padding: '14px 16px', background: '#0d1929', border: '1px solid #1e3a5f', borderRadius: '10px', color: '#93c5fd', fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{problem.sqlSchema}</pre>
                                            </div>
                                        )}
                                        {problem.expectedQueryResult && (
                                            <div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>✅ Expected Output</div>
                                                <pre style={{ margin: 0, padding: '14px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', color: '#34d399', fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{problem.expectedQueryResult}</pre>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>  
                                        {/* Example 1 — always show */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>Example 1</span>
                                                {runResult && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: runResult.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: runResult.passed ? '#4ade80' : '#f87171', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                                                        {runResult.passed ? '✅ Passed' : '❌ Wrong Answer'}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Input */}
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Input</div>
                                                <div style={{ background: '#0d1929', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                    <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', flex: 1 }}>{problem.sampleInput || 'No sample input provided'}</pre>
                                                    <button
                                                        onClick={() => { setCustomInput(problem.sampleInput || ''); setActiveOutputTab('input'); }}
                                                        title="Load into Custom Input"
                                                        style={{ flexShrink: 0, padding: '4px 10px', background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: '6px', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                        ▶ Use
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Output */}
                                            <div style={{ marginBottom: runResult ? '10px' : 0 }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Expected Output</div>
                                                <div style={{ background: 'rgba(16,185,129,0.06)', border: `1px solid ${runResult && !runResult.passed ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`, borderRadius: '10px', padding: '12px 16px' }}>
                                                    <pre style={{ margin: 0, color: '#34d399', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{problem.expectedOutput || problem.expected_output || 'See problem statement'}</pre>
                                                </div>
                                            </div>
                                            {/* Your output comparison (shown after run) */}
                                            {runResult && (
                                                <div style={{ marginTop: '10px' }}>
                                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Your Output</div>
                                                    <div style={{ background: runResult.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, borderRadius: '10px', padding: '12px 16px' }}>
                                                        <pre style={{ margin: 0, color: runResult.passed ? '#4ade80' : '#f87171', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{runResult.actual}</pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test cases from DB */}
                                        {testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                                            <div key={tc.id || i} style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>Example {i + 2}</div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Input</div>
                                                    <div style={{ background: '#0d1929', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                        <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', flex: 1 }}>{tc.input}</pre>
                                                        <button onClick={() => { setCustomInput(tc.input); setActiveOutputTab('input'); }} style={{ flexShrink: 0, padding: '4px 10px', background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: '6px', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>▶ Use</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Output</div>
                                                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '12px 16px' }}>
                                                        <pre style={{ margin: 0, color: '#34d399', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{tc.expectedOutput || tc.expected_output}</pre>
                                                    </div>
                                                </div>
                                                {tc.description && <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>ℹ️ {tc.description}</p>}
                                            </div>
                                        ))}
                                        {testCases.filter(tc => tc.isHidden).length > 0 && (
                                            <div style={{ textAlign: 'center', padding: '12px', background: '#1e293b', borderRadius: '10px', color: '#64748b', fontSize: '0.8rem' }}>
                                                🔒 +{testCases.filter(tc => tc.isHidden).length} hidden test cases will run on Submit
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Hints Tab */}
                        {descTab === 'hints' && (
                            <div style={{ padding: '1.5rem', flex: 1 }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
                                    AI hints guide you toward the solution without revealing it directly.
                                </p>
                                <button onClick={handleGetHint} disabled={loadingHint} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', borderRadius: '8px', color: '#1e293b', fontWeight: 700, fontSize: '0.88rem', cursor: loadingHint ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Lightbulb size={16} /> {loadingHint ? 'Generating...' : 'Get AI Hint'}
                                </button>
                                {hint && (
                                    <div style={{ marginTop: '1rem', padding: '14px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', color: '#4ade80', fontSize: '0.85rem', lineHeight: 1.7 }}>
                                        💡 {hint}
                                    </div>
                                )}
                                {/* Proctoring Rules in hints tab */}
                                <div style={{ marginTop: '1.5rem', padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={13} /> Proctoring Rules</div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.9 }}>
                                        <li>Do not switch tabs or windows</li>
                                        <li>Stay in fullscreen mode</li>
                                        <li>All violations are recorded</li>
                                        <li>3+ violations = disqualification</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Video Preview (if enabled) */}
                        {proctoring.videoAudio && (
                            <div style={{
                                marginTop: '2rem',
                                padding: '0.75rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '0.75rem',
                                border: '1px solid #334155',
                                position: 'relative'
                            }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        background: '#000',
                                        border: cameraBlocked ? '3px solid #ef4444' : '2px solid #10b981',
                                        opacity: cameraBlocked ? 0.5 : 1
                                    }}
                                />
                                {cameraBlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(239, 68, 68, 0.9)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <VideoOff size={14} /> CAMERA BLOCKED
                                    </div>
                                )}
                                <p style={{
                                    margin: '0.5rem 0 0',
                                    fontSize: '0.7rem',
                                    color: cameraBlocked ? '#ef4444' : '#10b981',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {!cameraBlocked && (
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#10b981',
                                            animation: 'pulse 1s infinite'
                                        }}></span>
                                    )}
                                    {cameraBlocked ? '⚠️ Uncover your camera!' : (modelLoaded ? '🤖 AI Monitoring Active' : '⏳ Loading AI...')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Code Editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e293b', minHeight: 0 }}>
                        {/* Toolbar */}
                        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', background: '#1e293b' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Language:</label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => {
                                        const newLang = e.target.value
                                        setSelectedLanguage(newLang)
                                        setCode(LANGUAGE_CONFIG[newLang]?.defaultCode || '')
                                    }}
                                    disabled={problem.type === 'SQL' || problem.language === 'SQL'}
                                    style={{
                                        background: '#0f172a',
                                        color: '#f8fafc',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.85rem',
                                        cursor: (problem.type === 'SQL' || problem.language === 'SQL') ? 'not-allowed' : 'pointer',
                                        opacity: (problem.type === 'SQL' || problem.language === 'SQL') ? 0.7 : 1
                                    }}
                                >
                                    {Object.keys(LANGUAGE_CONFIG).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {!isSQLProblem && (
                                    <button onClick={handleRun} disabled={isRunning || isSubmitting} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                        <Play size={16} /> {isRunning ? 'Running...' : 'Run Code'}
                                    </button>
                                )}
                                <button onClick={handleSubmit} disabled={isRunning || isSubmitting} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                    <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
                            <Editor
                                height="100%"
                                language={LANGUAGE_CONFIG[selectedLanguage]?.monacoLang || 'python'}
                                theme="vs-dark"
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    scrollBeyondLastLine: true,
                                    automaticLayout: true,
                                    padding: { top: 20 },
                                    smoothScrolling: true,
                                    cursorSmoothCaretAnimation: 'on',
                                    mouseWheelScrollSensitivity: 1.5,
                                    lineNumbersMinChars: 3,
                                    renderLineHighlight: 'all',
                                    scrollbar: {
                                        verticalScrollbarSize: 8,
                                        horizontalScrollbarSize: 8,
                                        useShadows: true,
                                    }
                                }}
                            />
                        </div>

                        {/* Output / SQL Tools Section — differs by problem type */}
                        {isSQLProblem ? (
                            /* ===== SQL TOOLS SUITE ===== */
                            <div style={{ borderTop: '1px solid #334155', padding: '1.25rem', background: '#0f172a', overflowY: 'auto', flex: '0 0 auto', maxHeight: '420px' }}>
                                {/* SQL Tool Tabs */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '4px', background: '#020617', borderRadius: '10px', width: 'fit-content' }}>
                                    <button
                                        onClick={() => setSqlTool('validator')}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            background: sqlTool === 'validator' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                            color: sqlTool === 'validator' ? '#60a5fa' : '#64748b',
                                            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}
                                    >
                                        <Shield size={14} /> Validator
                                    </button>
                                    <button
                                        onClick={() => setSqlTool('visualizer')}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            background: sqlTool === 'visualizer' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                            color: sqlTool === 'visualizer' ? '#a78bfa' : '#64748b',
                                            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}
                                    >
                                        <Database size={14} /> ER Diagram
                                    </button>
                                    <button
                                        onClick={() => setSqlTool('debugger')}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            background: sqlTool === 'debugger' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                            color: sqlTool === 'debugger' ? '#4ade80' : '#64748b',
                                            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}
                                    >
                                        <Layers size={14} /> Debugger
                                    </button>
                                </div>

                                {/* SQL Tool Content */}
                                <div>
                                    {sqlTool === 'validator' && (
                                        <SQLValidator
                                            query={code}
                                            onQueryChange={setCode}
                                            schemaContext={problem.sqlSchema}
                                        />
                                    )}
                                    {sqlTool === 'visualizer' && (
                                        <SQLVisualizer schema={problem.sqlSchema} />
                                    )}
                                    {sqlTool === 'debugger' && (
                                        <SQLDebugger query={code} schema={problem.sqlSchema} />
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ===== CODING OUTPUT TABS ===== */
                            <div style={{
                                flex: terminalSize === 'maximized' ? '0 0 560px' : terminalSize === 'minimized' ? '0 0 36px' : '0 0 360px',
                                background: '#020617', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', minHeight: 0,
                                transition: 'flex-basis 0.25s cubic-bezier(0.4,0,0.2,1)'
                            }}>
                                {/* Tab Headers */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#0f172a', alignItems: 'center' }}>
                                    {['input', 'output', 'tests'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => { setActiveOutputTab(tab); if (terminalSize === 'minimized') setTerminalSize('normal'); }}
                                            style={{
                                                padding: '0.75rem 1.25rem',
                                                background: activeOutputTab === tab ? '#1e293b' : 'transparent',
                                                border: 'none',
                                                borderBottom: activeOutputTab === tab ? `2px solid ${tab === 'input' ? '#f59e0b' : tab === 'output' ? '#3b82f6' : '#06b6d4'}` : '2px solid transparent',
                                                color: activeOutputTab === tab ? (tab === 'input' ? '#fbbf24' : tab === 'output' ? '#60a5fa' : '#06b6d4') : '#64748b',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {tab === 'input' && <>📝 Custom Input</>}
                                            {tab === 'output' && <>⚙️ Output {output.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: output.some(s => s.type === 'stderr') ? '#ef4444' : '#10b981' }}></span>}</>}
                                            {tab === 'tests' && <>🧪 Test Cases</>}
                                        </button>
                                    ))}
                                    {/* Always-visible resize controls */}
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
                                        <button onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')} title={terminalSize === 'minimized' ? 'Restore' : 'Minimize'} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: terminalSize === 'minimized' ? '#60a5fa' : '#475569', fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'minimized' ? '▲' : '─'}</button>
                                        <button onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')} title={terminalSize === 'maximized' ? 'Restore' : 'Maximize'} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: terminalSize === 'maximized' ? '#60a5fa' : '#475569', fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'maximized' ? '⊡' : '⊞'}</button>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                {activeOutputTab === 'input' && (
                                    <div style={{ padding: '0.75rem', flex: 1 }}>
                                        <textarea
                                            value={customInput}
                                            onChange={(e) => setCustomInput(e.target.value)}
                                            placeholder={`Enter your input here (stdin)...\nExample:\n5\n1 2 3 4 5`}
                                            style={{
                                                width: '100%',
                                                height: 'calc(100% - 30px)',
                                                background: '#0f172a',
                                                color: '#e2e8f0',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                resize: 'none',
                                                outline: 'none'
                                            }}
                                        />
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                                            💡 This input will be passed as stdin when you click "Run Code"
                                        </div>
                                    </div>
                                )}

                                {activeOutputTab === 'output' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#090d18', borderTop: '1px solid #1e3a5f' }}>

                                        {/* Terminal header bar */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: '#0d1929', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {/* Red = close/minimize, Amber = shrink, Green = maximize */}
                                                    <div
                                                        title="Minimize terminal"
                                                        onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')}
                                                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.15s' }}
                                                        onMouseEnter={e => e.target.style.opacity = 1}
                                                        onMouseLeave={e => e.target.style.opacity = 0.85}
                                                    />
                                                    <div
                                                        title="Normal size"
                                                        onClick={() => setTerminalSize('normal')}
                                                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.15s' }}
                                                        onMouseEnter={e => e.target.style.opacity = 1}
                                                        onMouseLeave={e => e.target.style.opacity = 0.85}
                                                    />
                                                    <div
                                                        title="Maximize terminal"
                                                        onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')}
                                                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.15s' }}
                                                        onMouseEnter={e => e.target.style.opacity = 1}
                                                        onMouseLeave={e => e.target.style.opacity = 0.85}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', fontFamily: 'ui-monospace,monospace' }}>TERMINAL</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {isRunning && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '4px', padding: '2px 8px' }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'blink 1s step-end infinite' }} />
                                                        RUNNING
                                                    </span>
                                                )}
                                                {!isRunning && output.length > 0 && (
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: runResult ? (runResult.passed ? '#4ade80' : '#f87171') : '#64748b' }}>
                                                        {runResult ? (runResult.passed ? '✅ Accepted' : '❌ Wrong Answer') : '● Finished'}
                                                    </span>
                                                )}
                                                {isRunning && (
                                                    <button onClick={stopRun} title="Kill process" style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: '#f87171', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>■ Stop</button>
                                                )}
                                                {/* Standalone minimize / maximize icon buttons */}
                                                <button
                                                    title={terminalSize === 'minimized' ? 'Restore' : 'Minimize'}
                                                    onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')}
                                                    style={{ padding: '2px 7px', background: 'rgba(71,85,105,0.2)', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1 }}
                                                >─</button>
                                                <button
                                                    title={terminalSize === 'maximized' ? 'Restore' : 'Maximize'}
                                                    onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')}
                                                    style={{ padding: '2px 6px', background: 'rgba(71,85,105,0.2)', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '0.65rem', cursor: 'pointer', lineHeight: 1 }}
                                                >{terminalSize === 'maximized' ? '⊡' : '⊞'}</button>
                                            </div>
                                        </div>

                                        {/* Scrollable output area */}
                                        <div ref={terminalRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'ui-monospace,SFMono-Regular,Consolas,monospace', fontSize: '0.84rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '80px' }}>
                                            {output.length > 0
                                                ? output.map((seg, i) => (
                                                    <span key={i} style={{ color: seg.type === 'stdin' ? '#4ade80' : seg.type === 'stderr' ? '#fca5a5' : seg.type === 'info' ? '#475569' : '#e2e8f0' }}>{seg.text}</span>
                                                ))
                                                : <span style={{ color: '#334155', fontStyle: 'italic' }}>▶ Click "Run Code" to execute your program…</span>
                                            }
                                            {isRunning && <span style={{ display: 'inline-block', width: '8px', height: '1em', background: '#4ade80', marginLeft: '1px', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
                                        </div>

                                        {/* Verdict block — shown after process exits */}
                                        {!isRunning && output.length > 0 && (
                                            <div style={{ flexShrink: 0, padding: '4px 16px 6px', fontSize: '0.7rem', color: '#334155' }}>
                                                <span style={{ color: '#4ade80' }}>█</span> = your input&nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>█</span> = stderr&nbsp;&nbsp;<span style={{ color: '#475569' }}>█</span> = compiler
                                            </div>
                                        )}
                                        {!isRunning && runResult && (
                                            <div style={{ flexShrink: 0, margin: '0 12px 10px', padding: '10px 14px', borderRadius: '8px', background: runResult.passed ? 'rgba(16,185,129,0.09)' : 'rgba(239,68,68,0.09)', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: runResult.passed ? 0 : '8px' }}>
                                                    <span style={{ fontSize: '1rem' }}>{runResult.passed ? '✅' : '❌'}</span>
                                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: runResult.passed ? '#4ade80' : '#f87171' }}>
                                                        {runResult.passed ? 'Accepted — Output matches expected!' : 'Wrong Answer — Output does not match'}
                                                    </span>
                                                </div>
                                                {!runResult.passed && (
                                                    <div style={{ paddingLeft: '28px' }}>
                                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px' }}>Expected output:</div>
                                                        <pre style={{ margin: 0, padding: '8px 12px', background: '#0d1929', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: '#34d399', fontSize: '0.78rem', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{runResult.expected}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Interactive stdin bar — always visible when running, hidden when done */}
                                        <div style={{ flexShrink: 0, borderTop: `2px solid ${isRunning ? '#16a34a' : '#1e293b'}`, background: isRunning ? '#051210' : '#0a0f1a', transition: 'border-color 0.2s, background 0.2s' }}>
                                            {isRunning ? (
                                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px', gap: '8px' }}>
                                                    <span style={{ color: '#4ade80', fontSize: '0.9rem', fontFamily: 'ui-monospace,monospace', fontWeight: 700, userSelect: 'none', flexShrink: 0 }}>$</span>
                                                    <input
                                                        type="text"
                                                        value={interactiveStdin}
                                                        onChange={e => setInteractiveStdin(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') sendInteractiveStdin() }}
                                                        placeholder="Type your input here and press Enter…"
                                                        autoFocus
                                                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.88rem', fontFamily: 'ui-monospace,SFMono-Regular,monospace', caretColor: '#4ade80' }}
                                                    />
                                                    <button
                                                        onClick={sendInteractiveStdin}
                                                        style={{ flexShrink: 0, padding: '6px 16px', background: '#16a34a', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}>
                                                        ↵ Send
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '36px', gap: '8px' }}>
                                                    <span style={{ color: '#1e3a5f', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace' }}>$</span>
                                                    <span style={{ color: '#334155', fontSize: '0.75rem', fontStyle: 'italic' }}>{output.length > 0 ? 'Process finished. Run code again to restart.' : 'Stdin will appear here when your program requests input'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeOutputTab === 'tests' && (
                                    <div style={{ padding: '0.75rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                        {testResults.length === 0 ? (
                                            <>
                                                <button
                                                    onClick={handleRunAllTests}
                                                    disabled={runningTests || isRunning}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                                        border: 'none',
                                                        color: 'white',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '6px',
                                                        marginBottom: '1rem',
                                                        cursor: runningTests ? 'not-allowed' : 'pointer',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {runningTests ? '⏳ Running All Tests...' : '🧪 Run All Tests'}
                                                </button>
                                                <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                                                    {(problem.type === 'SQL' || problem.language === 'SQL') ? (
                                                        <div>
                                                            <div style={{ marginBottom: '1rem' }}>
                                                                <strong style={{ color: '#06b6d4' }}>📊 Database Schema:</strong>
                                                                <pre style={{
                                                                    color: '#93c5fd',
                                                                    background: '#0f172a',
                                                                    padding: '0.75rem',
                                                                    borderRadius: '6px',
                                                                    marginTop: '0.5rem',
                                                                    fontSize: '0.75rem',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre-wrap',
                                                                    border: '1px solid #334155'
                                                                }}>{problem.sqlSchema || 'Schema not provided'}</pre>
                                                            </div>
                                                            <div>
                                                                <strong style={{ color: '#10b981' }}>📈 Expected Result:</strong>
                                                                <pre style={{
                                                                    color: '#4ade80',
                                                                    background: '#0f172a',
                                                                    padding: '0.75rem',
                                                                    borderRadius: '6px',
                                                                    marginTop: '0.5rem',
                                                                    fontSize: '0.75rem',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre-wrap',
                                                                    border: '1px solid #334155'
                                                                }}>{problem.expectedQueryResult || 'Expected result not provided'}</pre>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div style={{ marginBottom: '1rem' }}>
                                                                <strong style={{ color: '#f59e0b' }}>📥 Sample Input:</strong>
                                                                <pre style={{
                                                                    color: '#93c5fd',
                                                                    background: '#0f172a',
                                                                    padding: '0.75rem',
                                                                    borderRadius: '6px',
                                                                    marginTop: '0.5rem',
                                                                    fontSize: '0.75rem',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre-wrap',
                                                                    border: '1px solid #334155'
                                                                }}>{problem.sampleInput || 'N/A'}</pre>
                                                            </div>
                                                            <div>
                                                                <strong style={{ color: '#10b981' }}>📤 Expected Output:</strong>
                                                                <pre style={{
                                                                    color: '#4ade80',
                                                                    background: '#0f172a',
                                                                    padding: '0.75rem',
                                                                    borderRadius: '6px',
                                                                    marginTop: '0.5rem',
                                                                    fontSize: '0.75rem',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre-wrap',
                                                                    border: '1px solid #334155'
                                                                }}>{problem.expectedOutput || 'N/A'}</pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                                                <button
                                                    onClick={handleRunAllTests}
                                                    disabled={runningTests || isRunning}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                                        border: 'none',
                                                        color: 'white',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '6px',
                                                        marginBottom: '1rem',
                                                        cursor: runningTests ? 'not-allowed' : 'pointer',
                                                        fontWeight: 600,
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {runningTests ? '⏳ Running...' : '🔄 Run Tests Again'}
                                                </button>

                                                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1e293b', borderRadius: '6px' }}>
                                                    <strong style={{ color: '#06b6d4' }}>Test Results: </strong>
                                                    <span style={{ color: testResults.every(r => r.passed) ? '#10b981' : '#ef4444' }}>
                                                        {testResults.filter(r => r.passed).length}/{testResults.length} passed
                                                    </span>
                                                </div>

                                                {testResults.map((result, idx) => (
                                                    <div key={idx} style={{ marginBottom: '1rem', padding: '0.75rem', background: result.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${result.passed ? '#10b981' : '#ef4444'}`, borderRadius: '6px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                            <span style={{ fontSize: '1.2rem' }}>{result.passed ? '✅' : '❌'}</span>
                                                            <strong style={{ color: result.passed ? '#10b981' : '#ef4444' }}>Test {result.testNumber}</strong>
                                                        </div>

                                                        <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                                            <strong style={{ color: '#94a3b8' }}>Input:</strong>
                                                            <code style={{ color: '#cbd5e1', display: 'block', background: '#0f172a', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                                                                {result.input}
                                                            </code>
                                                        </div>

                                                        <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                                            <strong style={{ color: '#10b981' }}>Expected:</strong>
                                                            <code style={{ color: '#4ade80', display: 'block', background: '#0f172a', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                                                                {result.expected}
                                                            </code>
                                                        </div>

                                                        <div style={{ fontSize: '0.75rem' }}>
                                                            <strong style={{ color: result.passed ? '#10b981' : '#ef4444' }}>Actual:</strong>
                                                            <code style={{ color: result.passed ? '#4ade80' : '#ef4444', display: 'block', background: '#0f172a', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                                                                {result.error ? `ERROR: ${result.error}` : result.actual}
                                                            </code>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}

export default ProctoredCodeEditor

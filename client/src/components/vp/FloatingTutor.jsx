import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import VoiceTutor from './VoiceTutor'

/** Persistent floating chat widget — shown on every VidyaPath page. */
export default function FloatingTutor() {
    const [open, setOpen] = useState(false)
    if (!open) {
        return (
            <div className="vp-floating-tutor collapsed" onClick={() => setOpen(true)} role="button">
                <div className="vp-floating-tutor-header" style={{ borderRadius: 999 }}>
                    <Sparkles size={16} />
                    <span style={{ marginLeft: 6 }}>AI Tutor</span>
                </div>
            </div>
        )
    }
    return (
        <div className="vp-floating-tutor">
            <div className="vp-floating-tutor-header" onClick={() => setOpen(false)}>
                <span><Sparkles size={14} /> AI Tutor</span>
                <X size={16} onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
            </div>
            <div className="vp-floating-tutor-body">
                <VoiceTutor compact />
            </div>
        </div>
    )
}

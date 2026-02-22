/**
 * Certificate Service
 * Generates PDF certificates when students pass assessments.
 * Uses pdfkit for pure Node.js PDF generation.
 */

const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CertificateService {
    constructor(db) {
        this.db = db;
        this.certsDir = path.join(__dirname, '..', 'public', 'certificates');
        this._ensureDir();
    }

    _ensureDir() {
        if (!fs.existsSync(this.certsDir)) {
            fs.mkdirSync(this.certsDir, { recursive: true });
        }
    }

    // Generate a unique, verifiable code
    _verificationCode(studentId, sourceId) {
        return crypto
            .createHash('sha256')
            .update(`${studentId}::${sourceId}::${Date.now()}::${uuidv4()}`)
            .digest('hex')
            .slice(0, 32)
            .toUpperCase();
    }

    /**
     * Check if a student already has a certificate for this source
     */
    async hasCertificate(studentId, sourceId) {
        const [rows] = await this.db.query(
            'SELECT id FROM certificates WHERE student_id = ? AND source_id = ? AND is_valid = 1',
            [studentId, sourceId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Issue a certificate and generate PDF
     * @param {Object} opts - { studentId, studentName, mentorName, type, sourceId, sourceTitle, score, passingScore }
     */
    async issueCertificate(opts) {
        const {
            studentId, studentName, mentorName = 'MentorHub Platform',
            type, sourceId, sourceTitle, score, passingScore = 70
        } = opts;

        // Don't issue if score below passing threshold
        if (score < passingScore) {
            throw new Error(`Score ${score}% is below passing score ${passingScore}%`);
        }

        // Don't duplicate
        const existing = await this.hasCertificate(studentId, sourceId);
        if (existing) return { alreadyExists: true, certificateId: existing.id };

        const certId = uuidv4();
        const verificationCode = this._verificationCode(studentId, sourceId);
        const pdfFilename = `cert_${certId}.pdf`;
        const pdfPath = path.join(this.certsDir, pdfFilename);
        const publicPath = `/certificates/${pdfFilename}`;

        // Generate the PDF
        await this._generatePDF({
            certId, studentName, mentorName, sourceTitle,
            type, score, passingScore, verificationCode,
            issuedAt: new Date(),
            outputPath: pdfPath
        });

        // Save to DB
        await this.db.query(
            `INSERT INTO certificates 
            (id, student_id, student_name, mentor_name, certificate_type, source_id, source_title, score, passing_score, pdf_path, verification_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [certId, studentId, studentName, mentorName, type, sourceId, sourceTitle, score, passingScore, publicPath, verificationCode]
        );

        return {
            certificateId: certId,
            verificationCode,
            pdfPath: publicPath,
            studentName,
            sourceTitle,
            score,
            issuedAt: new Date().toISOString()
        };
    }

    /**
     * Determine medal/grade label from score
     */
    _getMedal(score) {
        if (score >= 90) return { label: 'DIAMOND',  sublabel: 'DIAMOND DISTINCTION', color: '#7c3aed', badgeBg: '#4c1d95', accentColor: '#c4b5fd', mark: 'DIAMOND DISTINCTION' };
        if (score >= 80) return { label: 'GOLD',     sublabel: 'GOLD DISTINCTION',    color: '#d97706', badgeBg: '#78350f', accentColor: '#fde68a', mark: 'GOLD DISTINCTION' };
        if (score >= 70) return { label: 'SILVER',   sublabel: 'SILVER ELITE',        color: '#64748b', badgeBg: '#334155', accentColor: '#e2e8f0', mark: 'SILVER ELITE' };
        if (score >= 60) return { label: 'ELITE',    sublabel: 'ELITE CERTIFIED',     color: '#0d9488', badgeBg: '#134e4a', accentColor: '#99f6e4', mark: 'ELITE CERTIFIED' };
        return              { label: 'PASS',     sublabel: 'PASS CERTIFIED',      color: '#2563eb', badgeBg: '#1e3a5f', accentColor: '#93c5fd', mark: 'PASS CERTIFIED' };
    }

    /**
     * Subject-specific "why" description for the certificate body
     */
    _getDescription(type) {
        const m = {
            skill_test:    'evaluated the candidate\'s software development skills through multi-stage technical assessment covering MCQ, coding problems, SQL, and interview rounds',
            aptitude_test: 'evaluated the candidate\'s analytical reasoning, quantitative aptitude, logical thinking, and problem-solving abilities',
            global_test:   'evaluated the candidate\'s comprehensive knowledge across multiple domains including aptitude, technical reasoning, and domain expertise',
            skill_path:    'evaluated the candidate\'s end-to-end proficiency through a structured learning pathway designed to build job-ready skills'
        };
        return m[type] || 'evaluated the candidate through a rigorous online assessment';
    }

    /**
     * Re-generate the PDF for an existing certificate (keeps same DB record, new file)
     */
    async regenerateCertificate(certId) {
        const [rows] = await this.db.query(
            `SELECT * FROM certificates WHERE id = ?`, [certId]
        );
        if (!rows.length) throw new Error('Certificate not found');
        const c = rows[0];

        const pdfFilename = `cert_${certId}.pdf`;
        const pdfPath = path.join(this.certsDir, pdfFilename);
        const publicPath = `/certificates/${pdfFilename}`;

        await this._generatePDF({
            certId,
            studentName: c.student_name,
            mentorName:  c.mentor_name,
            sourceTitle: c.source_title,
            type:        c.certificate_type,
            score:       parseFloat(c.score),
            passingScore: parseFloat(c.passing_score),
            verificationCode: c.verification_code,
            issuedAt:    new Date(c.issued_at),
            outputPath:  pdfPath
        });

        // Make sure pdf_path is correct in DB
        await this.db.query('UPDATE certificates SET pdf_path = ? WHERE id = ?', [publicPath, certId]);
        return { success: true, pdfPath: publicPath };
    }

    /**
     * Generate NPTEL-inspired PDF certificate
     */
    _generatePDF({ certId, studentName, mentorName, sourceTitle, type, score, passingScore, verificationCode, issuedAt, outputPath }) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            const W = 841.89, H = 595.28;
            const medal = this._getMedal(score);
            const desc  = this._getDescription(type);
            const typeLabels = {
                skill_test:    'Skill Assessment',
                aptitude_test: 'Aptitude Test',
                global_test:   'Comprehensive Test',
                skill_path:    'Learning Path'
            };
            const dateStr      = issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const displayTitle = sourceTitle.length > 54 ? sourceTitle.slice(0, 54) + '...' : sourceTitle;
            const scoreNum     = parseFloat(score).toFixed(0);
            const passNum      = parseFloat(passingScore || 70).toFixed(0);

            // == BACKGROUND ==
            doc.rect(0, 0, W, H).fill('#f5f0e1');

            // == BORDER SYSTEM ==
            doc.rect(7,  7,  W-14, H-14).lineWidth(5).stroke('#152d58');
            doc.rect(13, 13, W-26, H-26).lineWidth(1.5).stroke('#c9a84c');
            doc.rect(16, 16, W-32, H-32).lineWidth(0.6).stroke('#c9a84c');

            // == LEFT SIDEBAR (navy, 110px) ==
            const SBW = 110;
            const SBX = 18;
            const SBC = SBX + SBW / 2;
            doc.rect(SBX, 18, SBW, H-36).fill('#152d58');
            doc.moveTo(SBX+SBW, 18).lineTo(SBX+SBW, H-18).lineWidth(2.5).stroke('#c9a84c');

            // -- Stacked vertical brand "MENTORHUB" (big, fills sidebar) --
            const brandLetters = 'MENTORHUB';
            const letterFs = 26;
            const letterGap = 30;
            const brandStartY = 24;
            for (let i = 0; i < brandLetters.length; i++) {
                const ch = brandLetters[i];
                const isHub = i >= 6; // H-U-B are gold
                const yy = brandStartY + (i * letterGap);
                doc.fontSize(letterFs).font('Helvetica-Bold')
                   .fillColor(isHub ? '#c9a84c' : '#ffffff')
                   .text(ch, SBX, yy, { width: SBW, align: 'center', characterSpacing: 4 });
            }

            // gold divider below brand
            const divY1 = brandStartY + brandLetters.length * letterGap + 8;
            doc.moveTo(SBX+18, divY1).lineTo(SBX+SBW-18, divY1).lineWidth(1.2).stroke('#c9a84c');

            // -- Mentor Name below divider --
            doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold')
               .text(mentorName.toUpperCase(), SBX, divY1+10, { width: SBW, align: 'center', characterSpacing: 0.8 });
            doc.fontSize(6).fillColor('#7a92aa').font('Helvetica')
               .text('MENTOR', SBX, divY1+24, { width: SBW, align: 'center', characterSpacing: 2.5 });

            // -- CERTIFIED SEAL (below mentor, spaced) --
            const sealSY = divY1 + 72;
            doc.circle(SBC, sealSY, 30).lineWidth(2.5).stroke('#c9a84c');
            doc.circle(SBC, sealSY, 22).lineWidth(0.8).stroke('#c9a84c');
            doc.fontSize(6.5).fillColor('#c9a84c').font('Helvetica-Bold')
               .text('MENTOR', SBC-24, sealSY-10, { width: 48, align: 'center' })
               .text('HUB', SBC-24, sealSY-1, { width: 48, align: 'center' })
               .text('CERTIFIED', SBC-24, sealSY+7, { width: 48, align: 'center' });

            // -- Year of Issue (bottom) --
            doc.fontSize(14).fillColor('#a8bfd8').font('Helvetica-Bold')
               .text(issuedAt.getFullYear(), SBX, H-70, { width: SBW, align: 'center' });
            doc.fontSize(6).fillColor('#6a85a0').font('Helvetica')
               .text('YEAR OF ISSUE', SBX, H-54, { width: SBW, align: 'center', characterSpacing: 1.5 });

            // == CONTENT AREA ==
            const CX = SBX + SBW + 12;
            const CW = W - CX - 22;
            const CR = CX + CW;
            const CC = CX + CW / 2;

            // -- Top gold rule --
            doc.moveTo(CX, 24).lineTo(CR, 24).lineWidth(0.8).stroke('#c9a84c');

            // -- Header --
            doc.fontSize(10).fillColor('#666666').font('Helvetica-Oblique')
               .text('Online Learning & Mentorship Platform', CX, 30, { width: CW, align: 'center' });
            doc.moveTo(CX, 44).lineTo(CR, 44).lineWidth(0.8).stroke('#c9a84c');

            // == MEDAL-STYLE BADGE (circle medal with ribbon tails) ==
            const bText  = medal.sublabel;
            const medalCX = CC;
            const medalCY = 72;
            const medalR  = 22;

            // Ribbon tails (two angled rects behind the circle)
            doc.save();
            doc.moveTo(medalCX-30, medalCY+10).lineTo(medalCX-42, medalCY+38)
               .lineTo(medalCX-30, medalCY+32).lineTo(medalCX-18, medalCY+38)
               .closePath().fill(medal.color);
            doc.moveTo(medalCX+30, medalCY+10).lineTo(medalCX+18, medalCY+38)
               .lineTo(medalCX+30, medalCY+32).lineTo(medalCX+42, medalCY+38)
               .closePath().fill(medal.color);
            doc.restore();

            // Outer medal circle
            doc.circle(medalCX, medalCY, medalR).fill(medal.badgeBg);
            doc.circle(medalCX, medalCY, medalR).lineWidth(2.5).stroke(medal.color);
            doc.circle(medalCX, medalCY, medalR-4).lineWidth(0.8).stroke(medal.accentColor);

            // Medal label inside circle
            doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold')
               .text(medal.label, medalCX-20, medalCY-5, { width: 40, align: 'center' });

            // Sublabel text below medal
            doc.fontSize(9.5).fillColor(medal.color).font('Helvetica-Bold')
               .text(bText, CX, medalCY + medalR + 18, { width: CW, align: 'center', characterSpacing: 2 });

            // -- CERTIFICATE TITLE --
            const certTitleY = medalCY + medalR + 48;
            doc.fontSize(13).fillColor('#152d58').font('Helvetica-Bold')
               .text('C E R T I F I C A T E   O F   C O M P L E T I O N', CX, certTitleY, { width: CW, align: 'center' });

            // ornamental line
            const ornY = certTitleY + 17;
            doc.moveTo(CX+CW*0.25, ornY).lineTo(CX+CW*0.75, ornY).lineWidth(0.5).stroke('#c9a84c');

            // -- "This is to certify that" --
            doc.fontSize(9.5).fillColor('#666666').font('Helvetica')
               .text('This is to certify that', CX, ornY + 8, { width: CW, align: 'center' });

            // -- Student name --
            const nameFs = studentName.length > 24 ? (studentName.length > 32 ? 22 : 26) : 32;
            const nameY = ornY + 22;
            doc.fontSize(nameFs).fillColor('#152d58').font('Helvetica-Bold')
               .text(studentName.toUpperCase(), CX, nameY, { width: CW, align: 'center' });

            const nameHt = nameFs <= 22 ? 28 : nameFs <= 26 ? 34 : 40;
            // Gold underline
            const ulY = nameY + nameHt + 4;
            doc.moveTo(CX+CW*0.16, ulY).lineTo(CX+CW*0.84, ulY).lineWidth(1.2).stroke('#c9a84c');

            // -- "for successfully completing the course" --
            doc.fontSize(9.5).fillColor('#555555').font('Helvetica')
               .text('for successfully completing the course', CX, ulY+10, { width: CW, align: 'center' });

            // -- Course title --
            doc.fontSize(17).fillColor('#7c2d12').font('Helvetica-Bold')
               .text(`"${displayTitle}"`, CX, ulY+26, { width: CW, align: 'center', lineGap: 2 });

            const titleWrapped = (displayTitle.length * 10.5) > (CW * 0.92);
            const afterTitleY  = ulY + 26 + (titleWrapped ? 48 : 28);

            // Type label
            doc.fontSize(8.5).fillColor('#888888').font('Helvetica')
               .text(`[ ${typeLabels[type] || type} ]   -   Conducted on the MentorHub Platform`, CX, afterTitleY, { width: CW, align: 'center' });

            // -- Consolidated score line --
            const scoreLineY = afterTitleY + 18;
            const scoreText = `with a consolidated score of ${scoreNum} %`;
            doc.fontSize(11).fillColor('#333333').font('Helvetica-Bold')
               .text(scoreText, CX, scoreLineY, { width: CW, align: 'center' });

            // -- SCORE TABLE --
            const tableY = scoreLineY + 22;
            const tW = 300, tH = 40;
            const tX = CC - tW / 2;
            const midX = tX + tW / 2;

            doc.rect(tX, tableY, tW, tH).lineWidth(0.8).stroke('#444444');
            doc.moveTo(midX, tableY).lineTo(midX, tableY+tH).lineWidth(0.8).stroke('#444444');

            doc.fontSize(7).fillColor('#555555').font('Helvetica')
               .text('Score Achieved', tX, tableY+4, { width: tW/2, align: 'center' });
            doc.fontSize(14).fillColor(medal.color).font('Helvetica-Bold')
               .text(`${scoreNum}%`, tX, tableY+16, { width: tW/2, align: 'center' });

            doc.fontSize(7).fillColor('#555555').font('Helvetica')
               .text('Passing Score', midX, tableY+4, { width: tW/2, align: 'center' });
            doc.fontSize(14).fillColor('#444444').font('Helvetica-Bold')
               .text(`${passNum}%`, midX, tableY+16, { width: tW/2, align: 'center' });

            // -- DESCRIPTION paragraph --
            const descY = tableY + tH + 10;
            doc.fontSize(8).fillColor('#555555').font('Helvetica').lineGap(2.5)
               .text(
                   `This assessment ${desc}. The candidate appeared in the online proctored ` +
                   `assessment conducted by MentorHub and performance has been found satisfactory.`,
                   CX+16, descY, { width: CW-32, align: 'justify' }
               );

            // == SIGNATURE ROW (anchored near bottom) ==
            const hrY  = H - 128;
            const sigY = hrY + 10;

            doc.moveTo(CX, hrY).lineTo(CR, hrY).lineWidth(0.5).stroke('#cccccc');

            // Left - Date of Issue
            doc.fontSize(9).fillColor('#152d58').font('Helvetica-Bold')
               .text(dateStr, CX+4, sigY, { width: 174, align: 'center' });
            doc.moveTo(CX+4, sigY+14).lineTo(CX+178, sigY+14).lineWidth(0.5).stroke('#aaaaaa');
            doc.fontSize(7).fillColor('#888888').font('Helvetica')
               .text('Date of Issue', CX+4, sigY+17, { width: 174, align: 'center' });

            // Center - Seal
            const sealY2 = sigY + 18;
            doc.circle(CC, sealY2, 28).lineWidth(2.5).stroke('#152d58');
            doc.circle(CC, sealY2, 20).lineWidth(1).stroke('#c9a84c');
            doc.fontSize(6.5).fillColor('#152d58').font('Helvetica-Bold')
               .text('MENTOR', CC-20, sealY2-10, { width: 40, align: 'center' })
               .text('HUB', CC-20, sealY2-2, { width: 40, align: 'center' })
               .text('CERTIFIED', CC-20, sealY2+5, { width: 40, align: 'center' });

            // Right - Authorized mentor
            const rsX = CR - 180;
            doc.fontSize(9).fillColor('#152d58').font('Helvetica-Bold')
               .text(mentorName.toUpperCase(), rsX, sigY, { width: 170, align: 'center' });
            doc.moveTo(rsX, sigY+14).lineTo(rsX+170, sigY+14).lineWidth(0.5).stroke('#aaaaaa');
            doc.fontSize(7).fillColor('#888888').font('Helvetica')
               .text('Authorized By / Mentor', rsX, sigY+17, { width: 170, align: 'center' });

            // == FOOTER BAND ==
            const footY = H - 48;
            doc.rect(18, footY, W-36, 30).fill('#152d58');
            doc.fontSize(7).fillColor('#c4d4e8').font('Helvetica')
               .text(
                   `Verification Code: ${verificationCode}   |   Verify at: mentorhub.platform/verify   |   ${medal.mark}`,
                   24, footY+11, { width: W-48, align: 'center' }
               );

            doc.end();
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
    }

    /**
     * Get all certificates (admin view) with optional search
     */
    async getAllCertificates({ search = '', type = '', page = 1, limit = 30 } = {}) {
        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const limitNum = Math.max(1, parseInt(limit) || 30);
        let q = `SELECT c.*, u.email as student_email, u.batch as student_batch
                 FROM certificates c
                 LEFT JOIN users u ON u.id = c.student_id
                 WHERE 1=1`;
        const params = [];
        if (search) {
            q += ` AND (c.student_name LIKE ? OR c.source_title LIKE ? OR c.verification_code LIKE ? OR u.email LIKE ?)`;
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }
        if (type) {
            q += ` AND c.certificate_type = ?`;
            params.push(type);
        }
        q += ` ORDER BY c.issued_at DESC LIMIT ? OFFSET ?`;
        params.push(limitNum, (pageNum - 1) * limitNum);
        const [rows] = await this.db.query(q, params);

        // Count total
        let cq = `SELECT COUNT(*) as total FROM certificates c LEFT JOIN users u ON u.id = c.student_id WHERE 1=1`;
        const cp = [];
        if (search) {
            cq += ` AND (c.student_name LIKE ? OR c.source_title LIKE ? OR c.verification_code LIKE ? OR u.email LIKE ?)`;
            const like = `%${search}%`;
            cp.push(like, like, like, like);
        }
        if (type) { cq += ` AND c.certificate_type = ?`; cp.push(type); }
        const [[{ total }]] = await this.db.query(cq, cp);
        return { certificates: rows, total };
    }

    /**
     * Hard-delete a certificate (removes DB record + PDF file)
     */
    async deleteCertificate(certId) {
        const [rows] = await this.db.query('SELECT pdf_path FROM certificates WHERE id = ?', [certId]);
        if (rows.length === 0) throw new Error('Certificate not found');
        // Delete PDF file if it exists
        if (rows[0].pdf_path) {
            try {
                const filePath = path.join(__dirname, '..', 'public', rows[0].pdf_path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (_) {}
        }
        await this.db.query('DELETE FROM certificates WHERE id = ?', [certId]);
        return { success: true, deleted: certId };
    }

    /**
     * Get all certificates for a student
     */
    async getStudentCertificates(studentId) {
        const [rows] = await this.db.query(
            `SELECT id, student_name, mentor_name, certificate_type, source_title, 
                    score, passing_score, issued_at, pdf_path, verification_code, is_valid
             FROM certificates WHERE student_id = ? AND is_valid = 1
             ORDER BY issued_at DESC`,
            [studentId]
        );
        return rows;
    }

    /**
     * Verify a certificate by code
     */
    async verifyCertificate(verificationCode) {
        const [rows] = await this.db.query(
            `SELECT c.*, u.name as student_db_name 
             FROM certificates c
             LEFT JOIN users u ON u.id = c.student_id
             WHERE c.verification_code = ?`,
            [verificationCode]
        );
        if (rows.length === 0) return null;
        return { valid: rows[0].is_valid, ...rows[0] };
    }

    /**
     * Revoke a certificate (admin action)
     */
    async revokeCertificate(certId) {
        await this.db.query('UPDATE certificates SET is_valid = 0 WHERE id = ?', [certId]);
        return { success: true };
    }
}

module.exports = CertificateService;

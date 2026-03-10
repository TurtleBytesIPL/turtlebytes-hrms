import * as XLSX from 'xlsx'

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][]

        // ── Find the real header row (has "emp id" or "sl.no") ──────────────
        let headerIdx = -1
        for (let i = 0; i < Math.min(raw.length, 20); i++) {
          const joined = raw[i].map((v: any) => String(v ?? '').toLowerCase().trim()).join('|')
          if (joined.includes('sl.no') || joined.includes('sl no')) { headerIdx = i; break }
          if (joined.includes('emp id') && joined.includes('emp name')) { headerIdx = i }
        }
        if (headerIdx < 0) { resolve([]); return }

        // ── Build column index map from header row ───────────────────────────
        const headerRow = raw[headerIdx].map((v: any) => String(v ?? '').toLowerCase().trim())
        const col = (names: string[]): number => {
          for (const name of names) {
            const idx = headerRow.findIndex((h: string) => h.includes(name))
            if (idx >= 0) return idx
          }
          return -1
        }
        const COL = {
          empId:    col(['emp id', 'empid', 'employee id', 'emp_id']),
          name:     col(['emp name', 'employee name', 'name']),
          doj:      col(['doj', 'date of join', 'joining date', 'joined']),
          dob:      col(['dob', 'date of birth', 'birth']),
          blood:    col(['blood']),
          desig:    col(['designation', 'title', 'position', 'role']),
          phone:    col(['contact number', 'phone', 'mobile', 'contact']),
          email:    col(['email']),
          emgPhone: col(['emergency contact', 'emergency']),
          marital:  col(['marital']),
        }

        // Sub-header row exists (e.g. "Aadhar ID" / "PAN" under KYC Status)
        // Data starts 2 rows after header to skip sub-header
        const dataRows = raw.slice(headerIdx + 2)

        const fmtDate = (v: any): string | undefined => {
          if (!v && v !== 0) return undefined
          if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10)
          if (typeof v === 'number' && v > 1) {
            // Excel date serial
            try {
              const d = (XLSX as any).SSF?.parse_date_code?.(v)
              if (d?.y) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
            } catch {}
            // Fallback: JS date from serial
            const base = new Date(Date.UTC(1899, 11, 30))
            base.setUTCDate(base.getUTCDate() + Math.floor(v))
            if (!isNaN(base.getTime())) return base.toISOString().slice(0, 10)
          }
          const s = String(v).trim()
          if (!s || s === '0') return undefined
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
          const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
          if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`
          const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
          if (dmy) {
            const yr = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
            return `${yr}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
          }
          return undefined
        }

        const fmtPhone = (v: any): string | undefined => {
          if (!v) return undefined
          const s = String(v).replace(/\D/g, '')
          return s.length >= 10 ? s.slice(-10) : undefined
        }

        const fmtStr = (v: any): string | undefined => {
          const s = String(v ?? '').trim()
          return s && s !== 'null' && s !== 'undefined' && s !== '0' ? s : undefined
        }

        const empIdCol = COL.empId >= 0 ? COL.empId : 2
        const nameCol  = COL.name  >= 0 ? COL.name  : 3

        const parsed = dataRows
          .filter((row: any[]) => {
            const id   = String(row[empIdCol] ?? '').trim()
            const name = String(row[nameCol]  ?? '').trim()
            return id && name && id !== '0' && !/^\d$/.test(id)
          })
          .map((row: any[]) => {
            const rawName = String(row[nameCol] ?? '').trim().replace(/\.$/, '')
            const parts    = rawName.split(/[\s.]+/).filter(Boolean)
            const firstName = parts[0] ?? rawName
            const lastName  = parts.slice(1).join(' ') ?? ''
            return {
              empId:          String(row[empIdCol]).trim(),
              firstName,
              lastName,
              name:           rawName,
              joiningDate:    COL.doj   >= 0 ? fmtDate(row[COL.doj])    : undefined,
              dateOfBirth:    COL.dob   >= 0 ? fmtDate(row[COL.dob])    : undefined,
              bloodGroup:     COL.blood >= 0 ? fmtStr(row[COL.blood])   : undefined,
              jobTitle:       COL.desig >= 0 ? (fmtStr(row[COL.desig])  ?? 'Employee') : 'Employee',
              phone:          COL.phone >= 0 ? fmtPhone(row[COL.phone]) : undefined,
              email:          COL.email >= 0 ? fmtStr(row[COL.email])?.toLowerCase() : undefined,
              emergencyPhone: COL.emgPhone >= 0 ? fmtPhone(row[COL.emgPhone]) : undefined,
              maritalStatus:  COL.marital >= 0 ? fmtStr(row[COL.marital]) : undefined,
            }
          })
          .filter((r: any) => r.firstName && r.joiningDate)

        resolve(parsed)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsArrayBuffer(file)
  })
}

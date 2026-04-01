import { VISA_APPLICATIONS } from './visaData'

export interface VisaAlert {
  id:       string
  person:   string
  message:  string
  severity: 'critical' | 'warning' | 'info'
}

export function useVisaAlerts(): VisaAlert[] {
  return VISA_APPLICATIONS.flatMap(app => {
    const alerts: VisaAlert[] = []

    // Deadline < 30 dagar
    if (app.target_date) {
      const daysLeft = Math.ceil((new Date(app.target_date).getTime() - Date.now()) / 86400000)
      if (daysLeft < 30 && daysLeft > 0 && app.status !== 'approved') {
        alerts.push({
          id:       app.id,
          person:   app.person_name,
          message:  `${app.visa_type === 'investor_visa' ? 'Investor Visa' : app.visa_type === 'tourist' ? 'Tourist' : app.visa_type} deadline om ${daysLeft} dagar`,
          severity: daysLeft < 7 ? 'critical' : 'warning',
        })
      }
    }

    // Dokument saknas (bara om ansökan är påbörjad)
    if (app.status !== 'not_started') {
      const missingDocs = app.steps
        .flatMap(s => s.documents)
        .filter(d => d.required && d.status === 'needed').length
      if (missingDocs > 0) {
        alerts.push({
          id:       `${app.id}-docs`,
          person:   app.person_name,
          message:  `${missingDocs} dokument saknas`,
          severity: 'info',
        })
      }
    }

    return alerts
  })
}

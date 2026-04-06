// ─── People & Governance — Data ────────────────────────────────────────────────

import type { DISCProfile, HealthSnapshot } from './pgTypes'

export const DISC_PROFILES: DISCProfile[] = [
  {
    personId: 'erik-svensson',
    primary: 'D',
    secondary: 'I',
    scores: { D: 82, I: 65, S: 28, C: 45 },
    description: 'Starkt dominant med influentiell sekundärprofil. Resultatorienterad visionär som driver med energi och beslutsfattande.',
    strengths: ['Strategiskt tänkande', 'Snabba beslut', 'Visionärt ledarskap', 'Risktagande'],
    challenges: ['Tålamod i processer', 'Detaljhantering'],
    communicationStyle: 'Direkt, kortfattat, fokuserat på resultat. Vill ha summering, inte detaljer.',
    teamRole: 'Visionär drivkraft — sätter riktning och tempo',
    completedAt: '2026-03-29',
    source: 'manual',
  },
  {
    personId: 'leon-russo',
    primary: 'I',
    secondary: 'D',
    scores: { D: 60, I: 78, S: 42, C: 30 },
    description: 'Influentiell med hög energi och naturlig förmåga att bygga relationer. Driver försäljning och team med entusiasm.',
    strengths: ['Relationsskapande', 'Förhandling', 'Motivation', 'Nätverk'],
    challenges: ['Uppföljning och detaljer', 'Konsistens i processer'],
    communicationStyle: 'Entusiastisk och personlig. Bygger rapport snabbt. Vill diskutera möjligheter.',
    teamRole: 'Relationskatalysator — öppnar dörrar och bygger broar',
    completedAt: '2026-03-29',
    source: 'manual',
  },
  {
    personId: 'dennis-bjarnemark',
    primary: 'C',
    secondary: 'D',
    scores: { D: 55, I: 30, S: 38, C: 84 },
    description: 'Högkonscientiös jurist med stark analytisk förmåga. Detaljorienterad och systematisk med förmåga att leverera under press.',
    strengths: ['Juridisk precision', 'Riskanalys', 'Dokumentation', 'Systematik'],
    challenges: ['Snabba beslut utan full information', 'Flexibilitet i ostrukturerade situationer'],
    communicationStyle: 'Faktabaserad och metodisk. Vill ha fullständig information. Hög precision i kommunikation.',
    teamRole: 'Systembyggare — skapar juridisk och operativ struktur',
    completedAt: '2026-03-29',
    source: 'manual',
  },
  {
    personId: 'winston-bjarnemark',
    primary: 'C',
    secondary: 'S',
    scores: { D: 32, I: 38, S: 62, C: 78 },
    description: 'Noggrann finansiell analytiker med hög stabilitet. Konsekvent och pålitlig i ekonomisk kontroll och compliance.',
    strengths: ['Finansiell analys', 'Noggrannhet', 'Compliance', 'Pålitlighet'],
    challenges: ['Beslutsfattande under osäkerhet', 'Snabba prioriteringsbyten'],
    communicationStyle: 'Lugn och faktabaserad. Föredrar skriftlig kommunikation och tid att analysera.',
    teamRole: 'Finansiell ankare — säkerställer ekonomisk integritet',
    completedAt: '2026-03-29',
    source: 'manual',
  },
  {
    personId: 'johan-berglund',
    primary: 'C',
    secondary: 'I',
    scores: { D: 45, I: 58, S: 48, C: 76 },
    description: 'Teknisk expert med god kommunikationsförmåga. Kombinerar precision i kod med förmåga att förklara och samarbeta.',
    strengths: ['Teknisk excellens', 'Problemlösning', 'Dokumentation', 'Samarbete'],
    challenges: ['Att prioritera imperfekta lösningar', 'Delegering'],
    communicationStyle: 'Balanserad — kan vara teknisk men förstår affärsbehov. Vill förstå varför.',
    teamRole: 'Teknisk arkitekt — bygger och håller systemen levande',
    completedAt: '2026-03-29',
    source: 'manual',
  }]

export const HEALTH_DATA: HealthSnapshot[] = [
  // Placeholder — populeras via WHOOP OAuth
  {
    personId: 'erik-svensson',
    date: '2026-03-29',
    recoveryScore: undefined,
    sleepPerformance: undefined,
    energyLevel: 4,
    stressLevel: 3,
    motivationLevel: 5,
    note: 'Koppla WHOOP för automatisk hälsodata',
    source: 'self-report',
  }]

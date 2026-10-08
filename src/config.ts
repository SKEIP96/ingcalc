import type { Locale } from "./i18n/messages.ts";

export const STUDENT_NAME = "Nicolai Prodius";
export const STUDENT_NAME_RU = "Николай Продиус";
export const FACULTY_LABEL = "FEIE, UTM";
export const UNIVERSITY = "Universitatea Tehnică a Moldovei";
export const UNIVERSITY_RU = "Технический университет Молдовы";
export const COURSE = "Energetică";
export const COURSE_RU = "Энергетика";
export const SUBMISSION_DATE = "09.10.2026";
export const APP_NAME = "ElectroLab";
export const APP_SUBTITLE = "Calculator ingineresc pentru electrotehnică și energetică";
export const APP_SUBTITLE_RU = "Инженерный калькулятор по электротехнике и энергетике";

export function studentName(locale: Locale): string {
  return locale === "ru" ? STUDENT_NAME_RU : STUDENT_NAME;
}

export function universityName(locale: Locale): string {
  return locale === "ru" ? UNIVERSITY_RU : UNIVERSITY;
}

export function courseName(locale: Locale): string {
  return locale === "ru" ? COURSE_RU : COURSE;
}

export function appSubtitle(locale: Locale): string {
  return locale === "ru" ? APP_SUBTITLE_RU : APP_SUBTITLE;
}

export function footerLine(locale: Locale): string {
  return `${studentName(locale)} | ${FACULTY_LABEL}`;
}

export function footerNote(locale: Locale): string {
  return locale === "ru"
    ? `Выполнено в рамках курса «${COURSE_RU}», ${FACULTY_LABEL}.`
    : `Realizat în cadrul cursului „${COURSE}”, ${FACULTY_LABEL}.`;
}

export const THEME_KEY = "electrolab.theme";
export const LANGUAGE_KEY = "electrolab.language";
export const HISTORY_KEY = "electrolab.history.v1";
export const ENERGY_KEY = "electrolab.energy.v1";
export const HISTORY_LIMIT = 50;

import React from "react";

export const SpecialtyIcons = {
  "General Physician": () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Doctor cap */}
      <path d="M18 13h12v4H18z" fill="#0284c7" />
      <path d="M24 14.5v1M23.5 15h1" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      {/* Head */}
      <circle cx="24" cy="20" r="4.5" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" />
      {/* Neck & Body */}
      <path d="M19 28c0-3 2.5-4 5-4s5 1 5 4v9H19v-9z" fill="#ffffff" stroke="#475569" strokeWidth="1.8" />
      {/* Coat lapels */}
      <path d="M21 24l3 5 3-5" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stethoscope */}
      <path d="M20 27v3c0 2.5 1.8 4 4 4s4-1.5 4-4v-3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="36" r="1.5" fill="#f59e0b" />
    </svg>
  ),

  Dermatology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hair outline */}
      <path d="M28 12c-6 0-11 4-11 10 0 3 1.5 6 3 8v5c2 1 5 2 8 2" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Face profile */}
      <path d="M26 15c-1 2-1 4 0 6 1 1 2 2 2 4 0 2-2 3-3 4-1 1-1 3 0 4h4" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Earring / skin highlight */}
      <circle cx="24" cy="28" r="2" fill="#f59e0b" />
      <circle cx="31" cy="21" r="1.5" fill="#f59e0b" />
    </svg>
  ),

  "Obs & Gyn": () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fallopian tubes and uterus */}
      <path d="M17 19c-3-2-5 0-4 3s5 3 7 4c2 1 2 4 2 8v3h4v-3c0-4 0-7 2-8 2-1 6-1 7-4s-1-5-4-3" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Uterus body */}
      <path d="M21 26h6c0 4-1.5 7-3 8-1.5-1-3-4-3-8z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
      {/* Ovaries */}
      <circle cx="12" cy="22" r="2.5" fill="#f59e0b" />
      <circle cx="36" cy="22" r="2.5" fill="#f59e0b" />
    </svg>
  ),

  Orthopaedics: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Upper Femur bone */}
      <path d="M21 12h6v6c0 2 2 3 3 4-1 1-3 1-4 0-1 1-3 1-4 0-1 1-3 1-4 0 1-1 3-2 3-4v-6z" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Joint cartilage space */}
      <ellipse cx="24" cy="24" rx="4" ry="1.5" fill="#f59e0b" />
      {/* Lower Tibia bone */}
      <path d="M22 36h4v-7c0-1 2-2 3-3-2 0-3-1-3-1-1 1-3 1-4 0 0 0-1 1-3 1 1 1 3 2 3 3v7z" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),

  ENT: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head mirror strap */}
      <path d="M18 16h12" stroke="#475569" strokeWidth="1.8" />
      {/* ENT Reflector mirror */}
      <circle cx="20" cy="16" r="3.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="20" cy="16" r="1.2" fill="#ffffff" />
      {/* Face outline */}
      <circle cx="25" cy="22" r="6" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" />
      {/* Nose & Throat */}
      <path d="M25 21v3h2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      {/* Blue doctor collar */}
      <path d="M19 32c1-3 3-4 6-4s5 1 6 4v4H19v-4z" fill="#0284c7" />
    </svg>
  ),

  Neurology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Brain left lobe */}
      <path d="M23 15c-3-2-7 0-7 4 0 1-1 2-2 2-2 1-3 3-1 6 0 1-1 2 0 3 0 2 2 3 4 3 2 0 4-1 6-2V15z" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Brain right lobe */}
      <path d="M25 15c3-2 7 0 7 4 0 1 1 2 2 2 2 1 3 3 1 6 0 1 1 2 0 3 0 2-2 3-4 3-2 0-4-1-6-2V15z" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Gyri / Sulci inner folds */}
      <path d="M20 19c2 1 2 3 0 4M21 26c1-1 3 0 2 2M28 19c-2 1-2 3 0 4M27 26c-1-1-3 0-2 2" stroke="#db2777" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),

  Cardiology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Heart outline */}
      <path d="M24 35s-10-6.5-10-13.5a6 6 0 0 1 10-4.2 6 6 0 0 1 10 4.2C34 28.5 24 35 24 35z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" strokeLinejoin="round" />
      {/* ECG wave */}
      <path d="M16 22h4l2-4 3 8 2.5-5 1.5 2h4" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  Urology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Kidneys */}
      <path d="M19 16c-3 0-4 3-4 5s2 4 4 4c1 0 1-1 1-2s1-2 1-3-1-4-2-4z" stroke="#475569" strokeWidth="1.6" fill="#fef3c7" />
      <path d="M29 16c3 0 4 3 4 5s-2 4-4 4c-1 0-1-1-1-2s-1-2-1-3 1-4 2-4z" stroke="#475569" strokeWidth="1.6" fill="#fef3c7" />
      {/* Ureters */}
      <path d="M20 23c1 4 2 6 3 8M28 23c-1 4-2 6-3 8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bladder */}
      <path d="M21 31h6c1 2 0 4-3 4s-4-2-3-4z" fill="#f59e0b" stroke="#475569" strokeWidth="1.6" />
    </svg>
  ),

  Gastro: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Esophagus & Stomach */}
      <path d="M24 13v4c0 3-1 4-3 5-3 1-5 4-5 8 0 4 3 6 8 6s8-3 8-8c0-5-3-8-5-10v-5" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="#f8fafc" />
      {/* Acid fluid filling */}
      <path d="M18 27c2 2 5 2 8 0 3-1 4 1 4 3 0 3-3 4-6 4s-6-2-6-5c0-1 0-1 0-2z" fill="#f59e0b" opacity="0.85" />
    </svg>
  ),

  Psychiatry: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head silhouette */}
      <path d="M19 33v-3c0-4 1-7 3-8 0-1-1-3-1-5 0-5 3-7 7-7s7 2 7 7c0 4-1 6-2 7 1 2 2 4 2 9" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Swirling maze thought spiral */}
      <path d="M25 15a4 4 0 0 1 4 4c0 3-3 3-3 1a2 2 0 0 1 2-2" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M23 18c1-2 4-2 5 0s0 4-3 4" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  ),

  Paediatrics: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Swaddle blanket */}
      <path d="M20 23c-4 3-5 8-3 11s8 3 11 0 3-8 0-11l-8 0z" fill="#38bdf8" />
      {/* Baby face */}
      <circle cx="27" cy="18" r="5" fill="#fde68a" stroke="#475569" strokeWidth="1.6" />
      {/* Hair curl */}
      <path d="M27 13c1 0 1.5.5 1 1" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
      {/* Eyes & smile */}
      <circle cx="25.5" cy="17.5" r="0.7" fill="#475569" />
      <circle cx="28.5" cy="17.5" r="0.7" fill="#475569" />
      <path d="M26 20c.5.5 1.5.5 2 0" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),

  Pulmonology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trachea */}
      <path d="M24 13v7M22 15h4M22 17h4" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" />
      {/* Left lung */}
      <path d="M23 20c-3-1-7 1-8 4-2 4-1 8 1 10 3 2 6 1 7-2v-12z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" strokeLinejoin="round" />
      {/* Right lung with bronchial tree */}
      <path d="M25 20c3-1 7 1 8 4 2 4 1 8-1 10-3 2-6 1-7-2v-12z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" strokeLinejoin="round" />
      {/* Bronchial highlight */}
      <circle cx="24" cy="24" r="2.5" fill="#f59e0b" />
    </svg>
  ),

  Endocrinology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trachea windpipe */}
      <path d="M24 13v20M21 16h6M21 20h6M21 28h6" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" />
      {/* Butterfly Thyroid gland */}
      <path d="M19 22c-3-2-5 0-5 3s2 4 4 4c2 0 3-2 3-4s1-3 3-3 3 1 3 3 1 4 3 4c2 0 4-1 4-4s-2-5-5-3c-1 1-1 3-2 3s-1-2-2-3z" stroke="#475569" strokeWidth="1.8" fill="#fef3c7" />
      <circle cx="16" cy="25" r="1.5" fill="#f59e0b" />
      <circle cx="32" cy="25" r="1.5" fill="#f59e0b" />
      <circle cx="24" cy="22" r="1.2" fill="#f59e0b" />
    </svg>
  ),

  Nephrology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Kidney Left */}
      <path d="M18 17c-4 1-5 5-4 8s4 5 6 4c2-1 2-3 2-5s-1-4-2-5c-.7-.7-1.3-1.3-2-2z" stroke="#475569" strokeWidth="1.8" fill="#fef3c7" />
      <path d="M18 17c0-2 2-3 4-2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      {/* Kidney Right */}
      <path d="M30 17c4 1 5 5 4 8s-4 5-6 4c-2-1-2-3-2-5s1-4 2-5c.7-.7 1.3-1.3 2-2z" stroke="#475569" strokeWidth="1.8" fill="#fef3c7" />
      <path d="M30 17c0-2-2-3-4-2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      {/* Ureters & vessels */}
      <path d="M22 25c1 3 2 6 2 8M26 25c-1 3-2 6-2 8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Neurosurgery: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Brain outline */}
      <path d="M24 14c-5 0-9 4-9 9 0 3 1.5 6 4 7 1 2 2 4 5 4s4-2 5-4c2.5-1 4-4 4-7 0-5-4-9-9-9z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" />
      {/* Brain folds */}
      <path d="M21 18c2 2 2 5-1 7M26 19c-1 2 0 4 2 5" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
      {/* Surgical scalpel pointer */}
      <path d="M33 13l-6 6M31 11l4 4" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  Rheumatology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Joint bone */}
      <path d="M21 13h6v6c0 2 2 3 3 4-1 1-3 1-4 0-1 1-3 1-4 0-1 1-3 1-4 0 1-1 3-2 3-4v-6z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" />
      <path d="M22 35h4v-7c0-1 2-2 3-3-2 0-3-1-3-1-1 1-3 1-4 0 0 0-1 1-3 1 1 1 3 2 3 3v7z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" />
      {/* Arthritis inflammation flare sparks */}
      <path d="M14 24h3M31 24h3M16 20l2 2M30 22l2-2M16 28l2-2M30 26l2 2" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  Ophthalmology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Eye eyelids */}
      <path d="M14 24s4.5-7 10-7 10 7 10 7-4.5 7-10 7-10-7-10-7z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" strokeLinejoin="round" />
      {/* Iris with orange tone */}
      <circle cx="24" cy="24" r="4.5" stroke="#475569" strokeWidth="1.6" fill="#fef3c7" />
      <circle cx="24" cy="24" r="2.2" fill="#f59e0b" />
      <circle cx="25" cy="23" r="0.8" fill="#ffffff" />
      {/* Inspection magnifier loop */}
      <path d="M28 28l5 5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  "Surgical Gastro": () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stomach */}
      <path d="M23 14v3c0 3-1 4-3 5-3 1-5 4-5 8 0 4 3 6 8 6s8-3 8-8c0-5-3-8-5-10v-4" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" fill="#f8fafc" />
      {/* Fluid */}
      <path d="M18 28c2 2 5 2 7 0 2-1 4 1 4 2 0 3-3 4-5 4s-6-2-6-4v-2z" fill="#fef3c7" />
      {/* Surgical scalpel cross */}
      <path d="M30 16l-8 8M28 14l3 3" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  "Infectious Disease": () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Open Hand */}
      <path d="M18 33v-9c0-1.5 1.5-2 2-2s2 .5 2 2v-4c0-1.5 1.5-2 2-2s2 .5 2 2v-3c0-1.5 1.5-2 2-2s2 .5 2 2v8h1c1.5 0 2 1 2 2v7c0 3-2 5-5 5h-4c-2.5 0-4-2-4-5z" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="#f8fafc" />
      {/* Pathogen virus spots */}
      <circle cx="24" cy="27" r="1.5" fill="#f59e0b" />
      <circle cx="28" cy="29" r="1.8" fill="#f59e0b" />
      <circle cx="25" cy="33" r="1.2" fill="#f59e0b" />
      {/* Outer microbes */}
      <circle cx="34" cy="20" r="1.5" fill="#f59e0b" />
      <circle cx="15" cy="22" r="1.2" fill="#f59e0b" />
    </svg>
  ),

  "General Surgery": () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Human torso / abdomen */}
      <path d="M17 15c2 4 2 10 0 18h14c-2-8-2-14 0-18h-14z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" strokeLinejoin="round" />
      {/* Incision line with stitches */}
      <path d="M24 19v10M22 22h4M22 26h4" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
      {/* Scalpel */}
      <path d="M29 14l-4 4" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  Psychology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Psychologist face & hair */}
      <path d="M18 20c0-4 2.5-7 6-7s6 3 6 7v3c0 2-2 3-3 4v2h-6v-2c-1-1-3-2-3-4v-3z" fill="#f8fafc" />
      <path d="M18 21c0-4 2.5-6 6-6s6 2 6 6" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
      {/* Glasses */}
      <rect x="20" y="20" width="3.5" height="2.5" rx="1" stroke="#f59e0b" strokeWidth="1.4" />
      <rect x="24.5" y="20" width="3.5" height="2.5" rx="1" stroke="#f59e0b" strokeWidth="1.4" />
      <path d="M23.5 21h1" stroke="#f59e0b" strokeWidth="1.4" />
      {/* Shoulders */}
      <path d="M16 35c1-3 3-4 6-4h4c3 0 5 1 6 4" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  Oncology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cancer awareness ribbon */}
      <path d="M21 16c2-3 4-3 6 0 2 3 0 6-3 9l-4 6M27 16c-2-3-4-3-6 0-2 3 0 6 3 9l4 6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Supporting hands */}
      <path d="M15 32c3 1 5 1 8 0M33 32c-3 1-5 1-8 0" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  Diabetology: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glucometer device */}
      <rect x="22" y="14" width="10" height="18" rx="2" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" />
      <rect x="24" y="17" width="6" height="5" rx="0.5" fill="#e2e8f0" />
      <circle cx="27" cy="27" r="1.5" fill="#0284c7" />
      {/* Testing strip with blood drop */}
      <path d="M27 14v-2M27 10s-1.5 1.5-1.5 2.5a1.5 1.5 0 0 0 3 0c0-1-1.5-2.5-1.5-2.5z" fill="#f59e0b" />
      {/* Finger */}
      <path d="M16 19c2 0 3-1 4-3v6c0 4-2 7-5 7" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),

  Dentist: () => (
    <svg viewBox="0 0 48 48" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Molar Tooth */}
      <path d="M19 15c-3 0-5 2-5 5 0 4 2 8 2 13 0 1 1 2 2 2s2-1 2-3v-6c0-1 1-2 2-2s2 1 2 2v6c0 2 1 3 2 3s2-1 2-2c0-5 2-9 2-13 0-3-2-5-5-5-1 0-2 .5-2 1-.5-.5-1-1-2-1z" stroke="#475569" strokeWidth="1.8" fill="#f8fafc" strokeLinejoin="round" />
      {/* Dental mirror inspection tool */}
      <circle cx="31" cy="16" r="3" stroke="#f59e0b" strokeWidth="1.6" fill="#fef3c7" />
      <path d="M33 18l4 4" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

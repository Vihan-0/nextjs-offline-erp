import React from 'react';
import Image from 'next/image';

export interface StudentIDCardData {
  srNumber: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string; // Formatted DD.MM.YYYY
  className: string;
  mobile: string;
  address: string;
  photoUrl?: string | null;
  sessionYear?: string;
  schoolName?: string;
  schoolTagline?: string;
  schoolAddress?: string;
  schoolPhone?: string;
}

interface StudentIDCardProps {
  student: StudentIDCardData;
  className?: string;
}

export function StudentIDCard({ student, className = '' }: StudentIDCardProps) {
  const schoolName = student.schoolName || "TOWN HALL PUBLIC HIGH SCHOOL";
  const schoolTagline = student.schoolTagline || "(A Tradition in Quality Education)";
  const schoolAddress = student.schoolAddress || "Kundari Rakabganj, Ramapuram, Lucknow.";
  const schoolPhone = student.schoolPhone || "Mob. No.- 9235445596";
  const sessionYear = student.sessionYear ? `SESSION ${student.sessionYear}` : "SESSION 2026-2027";

  return (
    <div
      className={`student-id-card-root bg-white text-black font-sans relative border-2 border-black rounded-xl select-none shadow-md ${className}`}
      style={{
        width: '460px',
        height: '290px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        position: 'relative',
      }}
    >
      {/* 1. Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        {/* School Logo */}
        <div
          style={{
            width: '60px',
            height: '60px',
            minWidth: '60px',
            minHeight: '60px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src="/thphslogo.jpeg"
            alt="School Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* School Details */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '15px',
              fontWeight: '900',
              color: '#253582',
              textTransform: 'uppercase',
              margin: '0',
              lineHeight: '1.15',
              letterSpacing: '-0.2px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {schoolName}
          </h1>
          <p
            style={{
              fontSize: '11px',
              fontWeight: '700',
              fontStyle: 'italic',
              color: '#d11a2a',
              margin: '1px 0 0 0',
              lineHeight: '1.1',
            }}
          >
            {schoolTagline}
          </p>
          <p
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#111827',
              margin: '1px 0 0 0',
              lineHeight: '1.15',
            }}
          >
            {schoolAddress}
          </p>
          <p
            style={{
              fontSize: '10.5px',
              fontWeight: '900',
              color: '#000000',
              margin: '1px 0 0 0',
              lineHeight: '1.15',
            }}
          >
            {schoolPhone}
          </p>
        </div>
      </div>

      {/* 2. Navy Blue Ribbon Banner */}
      <div
        style={{
          backgroundColor: '#122b5e',
          color: '#ffffff',
          borderRadius: '9999px',
          padding: '2px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10.5px',
          fontWeight: '900',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          margin: '4px 0',
        }}
      >
        <span>STUDENT ID</span>
        <span>{sessionYear}</span>
      </div>

      {/* 3. Main Info + Photo Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '10px', flex: 1 }}>
        {/* Left: Aligned Student & Parent Details */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            fontSize: '10.5px',
            lineHeight: '1.3',
            color: '#000000',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Name</span>
            <span style={{ fontWeight: '900', textTransform: 'uppercase', color: '#000000' }}>: {student.fullName || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Father’s Name</span>
            <span style={{ fontWeight: '900', textTransform: 'uppercase', color: '#000000' }}>: {student.fatherName || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Mother’s Name</span>
            <span style={{ fontWeight: '900', textTransform: 'uppercase', color: '#000000' }}>: {student.motherName || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Date of Birth</span>
            <span style={{ fontWeight: '900', color: '#000000' }}>: {student.dateOfBirth || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Class</span>
            <span style={{ fontWeight: '900', textTransform: 'uppercase', color: '#000000' }}>: {student.className || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Mobile</span>
            <span style={{ fontWeight: '900', color: '#000000' }}>: {student.mobile || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ fontWeight: '700', width: '90px', flexShrink: 0, color: '#000000' }}>Address</span>
            <span style={{ fontWeight: '900', textTransform: 'uppercase', color: '#000000', lineHeight: '1.2' }}>
              : {student.address || '—'}
            </span>
          </div>
        </div>

        {/* Right: Photo Frame & Principal Signature */}
        <div
          style={{
            width: '84px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Photo Frame */}
          <div
            style={{
              width: '74px',
              height: '92px',
              border: '1.5px solid #000000',
              borderRadius: '3px',
              backgroundColor: '#f3f4f6',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <svg
                  style={{ width: '28px', height: '28px', margin: '0 auto 2px', color: '#9ca3af' }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span style={{ fontSize: '8px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase' }}>
                  PHOTO
                </span>
              </div>
            )}
          </div>

          {/* Principal Signature & Stamp */}
          <div style={{ width: '100%', textAlign: 'right', marginTop: 'auto', paddingRight: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', height: '20px', marginBottom: '-2px' }}>
              <svg
                viewBox="0 0 100 35"
                style={{ height: '22px', width: 'auto', color: '#1d4ed8' }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M 5 22 Q 20 5 35 18 T 55 12 Q 70 8 85 24 Q 92 10 98 18" />
                <path d="M 25 28 Q 50 32 88 26" strokeWidth="1.5" />
                <circle cx="92" cy="19" r="1.5" fill="#1d4ed8" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: '900',
                color: '#122b5e',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              PRINCIPAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

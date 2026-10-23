function ascii(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdf(value) {
  return ascii(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrap(value, width = 86) {
  const words = ascii(value).split(' ').filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ['Not provided'];
}

function displayDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime())
    ? ascii(value)
    : new Intl.DateTimeFormat('en-ZA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);
}

function buildDocumentLines(note) {
  const title = note.referralRequested
    ? 'CLINIC REFERRAL LETTER'
    : 'CLINIC SICK NOTE LETTER';
  const lines = [
    { text: 'CPUT DISTRICT SIX CAMPUS CLINIC', size: 15, bold: true, gap: 20 },
    { text: title, size: 12, bold: true, gap: 24 },
    { text: `Document reference: SN-${note.sickNoteId}`, bold: true },
    { text: `Issued: ${displayDate(note.signedAt)}` },
    { text: '', gap: 10 },
    { text: 'STUDENT AND CONSULTATION', bold: true, gap: 15 },
    { text: `Student: ${note.studentName}` },
    { text: `Student number: ${note.studentNumber}` },
    { text: `Completed consultation: ${note.appointmentType} on ${displayDate(note.appointmentDate)}` },
    { text: `Certified absence: ${displayDate(note.absenceStartDate)} to ${displayDate(note.absenceEndDate)}` },
    { text: '', gap: 10 },
    { text: 'CLINIC CONFIRMATION', bold: true, gap: 15 },
  ];

  wrap(note.reviewerComment || note.requestReason).forEach((text) =>
    lines.push({ text }),
  );

  if (note.referralRequested) {
    lines.push(
      { text: '', gap: 10 },
      { text: 'OPTIONAL REFERRAL FOR FURTHER ASSISTANCE', bold: true, gap: 15 },
      { text: `Receiving facility: ${note.referralFacilityName}` },
      { text: `Facility address: ${note.referralFacilityAddress}` },
      { text: `Facility contact: ${note.referralFacilityContact || 'Confirm directly with the facility'}` },
      { text: 'Reason for referral:', bold: true },
    );
    wrap(note.referralClinicalSummary).forEach((text) => lines.push({ text }));
    if (note.referralInstructions) {
      lines.push({ text: 'Further instructions:', bold: true });
      wrap(note.referralInstructions).forEach((text) => lines.push({ text }));
    }
  }

  lines.push(
    { text: '', gap: 12 },
    { text: 'ELECTRONIC CLINICAL SIGN-OFF', bold: true, gap: 15 },
    { text: `Signed by: ${note.signerName}` },
    { text: `Position: ${note.signerPosition || 'Clinic staff'}` },
    { text: `CPUT staff number: ${note.signerStaffNumber || 'Not available'}` },
    { text: `Electronic signature: ${note.signatureText}` },
    { text: `Signed at: ${displayDate(note.signedAt)}` },
    { text: '', gap: 12 },
    { text: 'IMPORTANT', bold: true, gap: 15 },
  );
  wrap(
    'This letter does not guarantee admission, an appointment, treatment, transport or payment. Contact the receiving facility to confirm its services and requirements. This workflow is not for emergencies. For severe or rapidly worsening symptoms, seek emergency care immediately or call 112 from a mobile phone or 10177 for an ambulance.',
  ).forEach((text) => lines.push({ text, size: 8 }));
  lines.push({ text: '', gap: 10 });
  wrap(
    'This document contains private health information. Store it securely and share it only with the intended healthcare provider.',
  ).forEach((text) => lines.push({ text, size: 8 }));

  return lines;
}

export function createReferralLetterPdf(note) {
  const lines = buildDocumentLines(note);
  const commands = ['BT'];
  let y = 748;

  lines.forEach((line) => {
    const size = line.size || 9;
    const gap = line.gap || 13;
    y -= gap;
    if (y < 45) return;
    commands.push(`/${line.bold ? 'F2' : 'F1'} ${size} Tf`);
    commands.push(`1 0 0 1 48 ${y} Tm`);
    commands.push(`(${escapePdf(line.text)}) Tj`);
  });
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadReferralLetter(note) {
  const url = URL.createObjectURL(createReferralLetterPdf(note));
  const link = document.createElement('a');
  link.href = url;
  link.download = `pulseup-${note.referralRequested ? 'referral' : 'sick-note'}-${note.sickNoteId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printReferralLetter(note) {
  const url = URL.createObjectURL(createReferralLetterPdf(note));
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.opener = null;
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 700);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

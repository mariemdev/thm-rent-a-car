import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, differenceInDays } from "date-fns";
import logoTHM from "../assets/img/logoTHM.png";
import { toast } from "sonner";

const POINTS_TO_MM = 25.4 / 72; // 0.352777778 mm per postscript point

/**
 * Helper to render text into a canvas and return a data URL with correct dimensions in mm.
 * This ensures any character the browser supports (Arabic, Accents, etc.) 
 * can be "drawn" into the PDF as an image when jsPDF's standard fonts fail.
 */
const renderTextToImage = (text: string, fontSize: number, color: string = "#000000", bold: boolean = false) => {
  if (!text) return null;
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const isRtl = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  // Set high resolution scale for crispness
  const scale = 4;
  const adjustedFontSize = fontSize * 0.9;
  
  // Set context parameters prior to measuring to ensure precision
  ctx.font = `${bold ? "bold " : ""}${adjustedFontSize * scale}px "Inter", "Segoe UI", "Tahoma", "Arial", sans-serif`;
  if (isRtl) {
    ctx.direction = "rtl";
  } else {
    ctx.direction = "ltr";
  }

  const metrics = ctx.measureText(text);
  const paddingX = 14;
  canvas.width = metrics.width + paddingX;
  canvas.height = (fontSize * scale) * 1.4;
  
  // Re-set font & properties after canvas resize
  ctx.font = `${bold ? "bold " : ""}${adjustedFontSize * scale}px "Inter", "Segoe UI", "Tahoma", "Arial", sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  
  if (isRtl) {
    ctx.direction = "rtl";
    ctx.textAlign = "right";
  } else {
    ctx.direction = "ltr";
    ctx.textAlign = "left";
  }
  
  // Clear to transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the text
  const startX = isRtl ? (canvas.width - paddingX / 2) : (paddingX / 2);
  ctx.fillText(text, startX, canvas.height / 2);
  
  return {
    data: canvas.toDataURL("image/png"),
    width: (canvas.width / scale) * POINTS_TO_MM,
    height: (canvas.height / scale) * POINTS_TO_MM
  };
};

/**
 * Checks if a string contains any non-ASCII characters.
 */
const hasNonAscii = (str: string) => {
  if (!str) return false;
  return /[^\x00-\x7F]/.test(str);
};

/**
 * Unified text drawing helper with automatic canvas fallback for non-ASCII.
 * Coordinates are computed in standard millimeters.
 */
const drawSmartText = (doc: jsPDF, text: string, x: number, y: number, fontSize: number, color: string = "#000000", bold: boolean = false, align: "left" | "center" | "right" = "left") => {
  if (!text) return;

  if (hasNonAscii(text)) {
    const imgObj = renderTextToImage(text, fontSize, color, bold);
    if (imgObj) {
      let finalX = x;
      if (align === "center") finalX = x - (imgObj.width / 2);
      if (align === "right") finalX = x - imgObj.width;
      
      // Compute vertical baseline matching
      const baselineY = y - (imgObj.height * 0.65);
      doc.addImage(imgObj.data, "PNG", finalX, baselineY, imgObj.width, imgObj.height);
      return;
    }
  }

  // Fallback to standard jsPDF text for ASCII
  doc.setTextColor(0, 0, 0); // Force black
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.text(text, x, y, { align });
};

export const generateContractPDF = (rental: any, settings: any, preparedBy?: string) => {
  if (!rental) {
    rental = {
      id: "PREVIEW",
      customer_name: "Jean Dupont",
      customer_birth_date: "1990-01-01",
      customer_birth_place: "Paris",
      customer_address: "Avenue de Paris",
      customer_phone: "99 999 999",
      customer_profession: "Ingénieur",
      customer_id_number: "12345678",
      customer_id_issued_date: "2015-05-15",
      customer_id_issued_at: "Tunis",
      customer_license_number: "98/12345",
      customer_license_issued_date: "2010-06-20",
      customer_license_issued_place: "Bizerte",
      second_driver_name: "",
      brand: "Peugeot",
      model: "208",
      registration: "220 TUN 1234",
      color: "Noir",
      fuel_type: "Essence",
      power: "5",
      year: "2022",
      seats: "5",
      transmission: "Manuelle",
      start_date: "2026-05-20",
      departure_time: "10:00",
      departure_place: "Bizerte",
      end_date: "2026-05-23",
      return_time: "10:00",
      return_place: "Bizerte",
      deposit_amount: "500",
      daily_price: "90",
      other_charges: "0",
      vat: "19",
      stamp_duty: "7.000",
      total_price: "270",
      amount_paid: "270",
      min_age_confirmed: true,
      license_duration_confirmed: true
    };
  }

  try {
    const doc = new jsPDF();
  
  const COMPANY_INFO = {
    name: settings?.company_name || "THM RENT A CAR",
    address: settings?.company_address || "Rue Habib Thameur, Bizerte/17 Rue Osmane Bhri, Tunis",
    mobile: settings?.company_phone || "20 336 278 / 99 336 216",
    whatsapp: settings?.company_whatsapp || "58 599 171",
    mf: settings?.company_mf || "1818698/Y/A/M/000",
    email: settings?.company_email || "thmrentacar@outlook.com"
  };

  // --- HEADER SECTION ---
  // Top right logo from local assets
  try {
    doc.addImage(logoTHM, 'PNG', 165, 4, 33, 15);
  } catch (e) {
    console.error("Error adding logoTHM from assets, attempting fallback to settings logo", e);
    if (settings?.company_logo) {
      try {
        doc.addImage(settings.company_logo, 'PNG', 165, 4, 33, 15);
      } catch (err) {
        console.error("Error adding settings fallback logo", err);
      }
    }
  }

  // Center Arabic/French title with red text
  // Box is sized to its content so the left column keeps as much width as possible
  const contractTitle = `CONTRAT DE LOCATION N° ${rental.contract_number || rental.id}`;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  const titleBoxRight = 145;
  const titleBoxWidth = Math.min(65, doc.getTextWidth(contractTitle) + 6);
  const titleBoxX = titleBoxRight - titleBoxWidth;
  const titleBoxCenter = titleBoxX + titleBoxWidth / 2;

  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.roundedRect(titleBoxX, 4, titleBoxWidth, 14.5, 1.5, 1.5, 'D');
  drawSmartText(doc, "عقد كراء السيارة", titleBoxCenter, 8.5, 11, "#C00000", true, "center");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(contractTitle, titleBoxCenter, 13.5, { align: "center" });
  
  drawSmartText(doc, "Autovermietung - Rent a Car", 112.5, 24, 8, "#000000", true, "center");

  // Left side info with red brand name
  drawSmartText(doc, "THM RENT A CAR", 15, 8, 14, "#C00000", true);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const addressMaxWidth = titleBoxX - 2 - 15;
  let addressFontSize = 7.5;
  while (addressFontSize > 5.5 && doc.getTextWidth(COMPANY_INFO.address) > addressMaxWidth) {
    addressFontSize -= 0.25;
    doc.setFontSize(addressFontSize);
  }
  doc.text(COMPANY_INFO.address, 15, 13);
  doc.setFontSize(7.5);
  doc.text(`Mobile : ${COMPANY_INFO.mobile}`, 15, 17);
  doc.text(`WhatsApp : ${COMPANY_INFO.whatsapp}`, 15, 21);
  doc.text(`MF : ${COMPANY_INFO.mf}`, 15, 25);
  doc.text(`email : ${COMPANY_INFO.email}`, 15, 29);

  // --- DRIVERS SECTION ---
  let currentY = 34;
  doc.setLineWidth(0.1);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("PREMIER CONDUCTEUR", 15, currentY);
  doc.text("DEUXIEME CONDUCTEUR", 110, currentY);
  drawSmartText(doc, "السائق الأول", 95, currentY, 9.5, "#000000", true, "right");
  drawSmartText(doc, "السائق الثاني", 195, currentY, 9.5, "#000000", true, "right");

  currentY += 1.5;
  const col1X = 15;
  const col1LabelX = 42;
  const col1ArabicX = 98;
  
  const col2X = 110;
  const col2LabelX = 137;
  const col2ArabicX = 195;

  // Robust field retrieval to support fallback between _place and _at
  const getValue = (key: string) => {
    if (rental[key] !== undefined && rental[key] !== null) {
      return String(rental[key]);
    }
    const altKey = key.endsWith("_place") 
      ? key.replace("_place", "_at") 
      : key.endsWith("_at") 
      ? key.replace("_at", "_place") 
      : "";
    if (altKey && rental[altKey] !== undefined && rental[altKey] !== null) {
      return String(rental[altKey]);
    }
    return "";
  };

  const getDriverVal = (key: string, defaultKey: string) => {
    if (rental.customer_type === "company") {
      if (rental[key] !== undefined && rental[key] !== null && String(rental[key]) !== "") {
        return String(rental[key]);
      }
    }
    return getValue(defaultKey);
  };

  // Human Name splitting heuristics if Prénom field is not separately filled
  let firstName1 = (rental.customer_firstname !== undefined && rental.customer_firstname !== null && rental.customer_firstname !== "") ? String(rental.customer_firstname) : getValue("customer_firstname");
  let lastName1 = (rental.customer_lastname !== undefined && rental.customer_lastname !== null && rental.customer_lastname !== "") ? String(rental.customer_lastname) : getValue("customer_name");

  if (rental.customer_type === "company" && rental.driver_name) {
    lastName1 = rental.driver_lastname || rental.driver_name;
    firstName1 = rental.driver_firstname || "";
    if (!firstName1) {
      const parts = lastName1.trim().split(/\s+/);
      if (parts.length > 1) {
        firstName1 = parts[0];
        lastName1 = parts.slice(1).join(" ");
      }
    }
  } else if (!firstName1 && lastName1) {
    const parts = lastName1.trim().split(/\s+/);
    if (parts.length > 1) {
      firstName1 = parts[0];
      lastName1 = parts.slice(1).join(" ");
    }
  }

  let firstName2 = getValue("second_driver_firstname");
  let lastName2 = getValue("second_driver_name");
  if (!firstName2 && lastName2) {
    const parts = lastName2.trim().split(/\s+/);
    if (parts.length > 1) {
      firstName2 = parts[0];
      lastName2 = parts.slice(1).join(" ");
    }
  }

  const driverFields = [
    { label: "Nom :", val: lastName1, arabic: "اللقب:" },
    { label: "Prénom :", val: firstName1, arabic: "الإسم:" },
    { label: "Né le :", val: getDriverVal("driver_birth_date", "customer_birth_date"), arabic: "تاريخ الولادة" },
    { label: "A :", val: getDriverVal("driver_birth_place", "customer_birth_place"), arabic: "مكانها:" },
    { label: "Adresse :", val: getDriverVal("driver_address", "customer_address"), arabic: "العنوان:" },
    { label: "Tél :", val: getDriverVal("driver_phone", "customer_phone"), arabic: "الهاتف:" },
    { label: "Profession :", val: getDriverVal("driver_profession", "customer_profession"), arabic: "المهنة:" },
    { label: "CIN/Passeport N° :", val: getDriverVal("driver_id_number", "customer_id_number"), arabic: "بطاقة تعريف رقم:" },
    { label: "Délivrée le :", val: getDriverVal("driver_id_issued_date", "customer_id_issued_date"), arabic: "بتاريخ:" },
    { label: "A :", val: getDriverVal("driver_id_issued_at", "customer_id_issued_at"), arabic: "في:" },
    { label: "Permis N° :", val: getDriverVal("driver_license_number", "customer_license_number"), arabic: "رخصة سياقة رقم:" },
    { label: "Délivré le :", val: getDriverVal("driver_license_issued_date", "customer_license_issued_date"), arabic: "بتاريخ:" },
    { label: "A :", val: getDriverVal("driver_license_issued_place", "customer_license_issued_place"), arabic: "في:" }
  ];

  const driver2Fields = [
    { label: "Nom :", val: lastName2, arabic: "اللقب:" },
    { label: "Prénom :", val: firstName2, arabic: "الإسم:" },
    { label: "Né le :", val: getValue("second_driver_birth_date"), arabic: "تاريخ الولادة" },
    { label: "A :", val: getValue("second_driver_birth_place"), arabic: "مكانها:" },
    { label: "Adresse :", val: getValue("second_driver_address"), arabic: "العنوان:" },
    { label: "Tél :", val: getValue("second_driver_phone"), arabic: "الهاتف:" },
    { label: "Profession :", val: getValue("second_driver_profession"), arabic: "المهنة:" },
    { label: "CIN/Passeport N° :", val: getValue("second_driver_id_number"), arabic: "بطاقة تعريف رقم:" },
    { label: "Délivré le :", val: getValue("second_driver_id_issued_date"), arabic: "بتاريخ:" },
    { label: "A :", val: getValue("second_driver_id_issued_at"), arabic: "في:" },
    { label: "Permis N° :", val: getValue("second_driver_license_number"), arabic: "رخصة سياقة رقم:" },
    { label: "Délivré le :", val: getValue("second_driver_license_issued_date"), arabic: "بتاريخ:" },
    { label: "A :", val: getValue("second_driver_license_issued_place"), arabic: "في:" }
  ];

  doc.setFontSize(8);
  let fieldY = currentY;
  for (let i = 0; i < driverFields.length; i++) {
    const f = driverFields[i];
    const f2 = driver2Fields[i];
    fieldY += 4.6;

    // Col 1 (Driver 1)
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(f.label, col1X, fieldY);
    drawSmartText(doc, f.val, col1LabelX, fieldY, 8, "#000000", true, "left");
    drawSmartText(doc, f.arabic, col1ArabicX, fieldY, 8, "#000000", false, "right");

    // Col 2 (Driver 2)
    doc.setFont("helvetica", "normal");
    doc.text(f2.label, col2X, fieldY);
    drawSmartText(doc, f2.val, col2LabelX, fieldY, 8, "#000000", true, "left");
    drawSmartText(doc, f2.arabic, col2ArabicX, fieldY, 8, "#000000", false, "right");
    
    // Aesthetic hand-written line markers
    doc.setDrawColor(220);
    doc.line(col1LabelX, fieldY + 0.5, col1ArabicX - 12, fieldY + 0.5);
    doc.line(col2LabelX, fieldY + 0.5, col2ArabicX - 12, fieldY + 0.5);
  }

  const hasRental = !!rental;
  const showAge = !hasRental || rental.min_age_confirmed === true || rental.min_age_confirmed === 1 || rental.min_age_confirmed === "true";
  const showLicense = !hasRental || rental.license_duration_confirmed === true || rental.license_duration_confirmed === 1 || rental.license_duration_confirmed === "true";

  if (showAge || showLicense) {
    currentY = fieldY + 5.5;
    doc.setDrawColor(230);
    doc.setFillColor(245, 245, 245);
    doc.rect(10, currentY - 3.5, 190, 4.5, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    let text = "Attention :";
    if (showAge && showLicense) {
      text += " Age minimum exigé 25 ans, permis délivré depuis au moins 2 ans.";
    } else if (showAge) {
      text += " Age minimum exigé 25 ans.";
    } else {
      text += " permis délivré depuis au moins 2 ans.";
    }
    
    doc.setFontSize(7.5);
    doc.text(text, 105, currentY - 0.5, { align: "center" });
    currentY += 4.5;
  } else {
    currentY = fieldY + 2.5;
  }

  // --- CONSOLIDATED VEHICLE & RENTAL DATES TABLES (DYNAMIC MULTI-VEHICLE SUPPORT) ---
  const swaps = typeof rental.swaps === 'string' ? JSON.parse(rental.swaps) : (rental.swaps || []);
  const segments: any[] = [];

  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch (e) {
      return dateStr;
    }
  };

  if (swaps.length === 0) {
    segments.push({
      brand: rental.brand || "",
      model: rental.model || "",
      registration: rental.registration || "",
      km_depart: rental.km_depart || "0",
      fuel_depart_bars: (rental.fuel_depart_bars !== undefined && rental.fuel_depart_bars !== null && rental.fuel_depart_bars !== "" && rental.fuel_depart_bars !== "0" && rental.fuel_depart_bars !== 0) ? rental.fuel_depart_bars : "....................",
      start_date: rental.start_date || "",
      departure_place: rental.departure_place || "",
      departure_time: rental.departure_time || "",
      end_date: rental.end_date || "",
      return_place: rental.return_place || "",
      return_time: rental.return_time || "",
      return_mileage: rental.return_mileage || "....................",
      fuel_return_bars: rental.fuel_return_bars !== undefined && rental.fuel_return_bars !== null && rental.fuel_return_bars !== "" && rental.fuel_return_bars !== 0 && rental.fuel_return_bars !== "0" ? rental.fuel_return_bars : "....................",
      fuel_total_bars: rental.fuel_total_bars,
      prolongation_date: rental.prolongation_date ? formatDateSafe(rental.prolongation_date) : "",
      prolongation_place: rental.prolongation_place || "",
      prolongation_time: rental.prolongation_time || ""
    });
  } else {
    // First segment is the original car
    const firstSwap = swaps[0];
    segments.push({
      brand: firstSwap.old_car.brand || "",
      model: firstSwap.old_car.model || "",
      registration: firstSwap.old_car.registration || "",
      km_depart: rental.km_depart || "0",
      fuel_depart_bars: (rental.fuel_depart_bars !== undefined && rental.fuel_depart_bars !== null && rental.fuel_depart_bars !== "" && rental.fuel_depart_bars !== "0" && rental.fuel_depart_bars !== 0) ? rental.fuel_depart_bars : "....................",
      start_date: rental.start_date || "",
      departure_place: rental.departure_place || "",
      departure_time: rental.departure_time || "",
      end_date: formatDateSafe(firstSwap.date),
      return_place: rental.return_place || rental.departure_place || "",
      return_time: rental.departure_time || "",
      return_mileage: firstSwap.old_car.return_mileage || "....................",
      fuel_return_bars: firstSwap.old_car.return_fuel !== undefined && firstSwap.old_car.return_fuel !== null && firstSwap.old_car.return_fuel !== "" && firstSwap.old_car.return_fuel !== 0 && firstSwap.old_car.return_fuel !== "0" ? firstSwap.old_car.return_fuel : "....................",
      fuel_total_bars: firstSwap.old_car.fuel_total_bars || rental.fuel_total_bars
    });

    // Intermediate segments if multiple swaps exist
    for (let i = 1; i < swaps.length; i++) {
      const prevSwap = swaps[i - 1];
      const currSwap = swaps[i];
      segments.push({
        brand: currSwap.old_car.brand || "",
        model: currSwap.old_car.model || "",
        registration: currSwap.old_car.registration || "",
        km_depart: prevSwap.new_car.start_mileage || "0",
        fuel_depart_bars: (prevSwap.new_car.start_fuel !== undefined && prevSwap.new_car.start_fuel !== null && prevSwap.new_car.start_fuel !== "" && prevSwap.new_car.start_fuel !== "0" && prevSwap.new_car.start_fuel !== 0) ? prevSwap.new_car.start_fuel : "....................",
        start_date: formatDateSafe(prevSwap.date),
        departure_place: rental.departure_place || "",
        departure_time: rental.departure_time || "",
        end_date: formatDateSafe(currSwap.date),
        return_place: rental.return_place || rental.departure_place || "",
        return_time: rental.departure_time || "",
        return_mileage: currSwap.old_car.return_mileage || "....................",
        fuel_return_bars: currSwap.old_car.return_fuel !== undefined && currSwap.old_car.return_fuel !== null && currSwap.old_car.return_fuel !== "" && currSwap.old_car.return_fuel !== 0 && currSwap.old_car.return_fuel !== "0" ? currSwap.old_car.return_fuel : "....................",
        fuel_total_bars: currSwap.old_car.fuel_total_bars || prevSwap.new_car.fuel_total_bars || rental.fuel_total_bars
      });
    }

    // Last segment is the current active car after the final swap
    const lastSwap = swaps[swaps.length - 1];
    segments.push({
      brand: rental.brand || "",
      model: rental.model || "",
      registration: rental.registration || "",
      km_depart: lastSwap.new_car.start_mileage || "0",
      fuel_depart_bars: (lastSwap.new_car.start_fuel !== undefined && lastSwap.new_car.start_fuel !== null && lastSwap.new_car.start_fuel !== "" && lastSwap.new_car.start_fuel !== "0" && lastSwap.new_car.start_fuel !== 0) ? lastSwap.new_car.start_fuel : "....................",
      start_date: formatDateSafe(lastSwap.date),
      departure_place: rental.departure_place || "",
      departure_time: rental.departure_time || "",
      end_date: rental.end_date || "",
      return_place: rental.return_place || "",
      return_time: rental.return_time || "",
      return_mileage: rental.return_mileage || "....................",
      fuel_return_bars: rental.fuel_return_bars !== undefined && rental.fuel_return_bars !== null && rental.fuel_return_bars !== "" && rental.fuel_return_bars !== "0" && rental.fuel_return_bars !== 0 ? rental.fuel_return_bars : "....................",
      fuel_total_bars: rental.fuel_total_bars,
      prolongation_date: rental.prolongation_date ? formatDateSafe(rental.prolongation_date) : "",
      prolongation_place: rental.prolongation_place || "",
      prolongation_time: rental.prolongation_time || ""
    });
  }

  // Draw each segment's table
  segments.forEach((seg, segIndex) => {
    currentY += 4.5;
    const tableTop = currentY;
    const colW = 190 / 4; // 47.5 mm per column
    const tableH = 22.5;  // Standard row height of 22.5 mm

    doc.setLineWidth(0.15);
    doc.setDrawColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(10, tableTop, 190, tableH);
    doc.rect(10, tableTop, 190, 4.5, 'F'); // Shaded header background
    doc.rect(10, tableTop, 190, 4.5, 'D'); // Border for header

    // Vertical dividers for the 4 columns
    doc.line(10 + colW, tableTop, 10 + colW, tableTop + tableH);
    doc.line(10 + colW * 2, tableTop, 10 + colW * 2, tableTop + tableH);
    doc.line(10 + colW * 3, tableTop, 10 + colW * 3, tableTop + tableH);

    // Headers with specific labels if multi-vehicle
    const vehHeader = swaps.length > 0 ? `VÉHICULE #${segIndex + 1} / العربة` : "VÉHICULE / العربة";
    drawSmartText(doc, vehHeader, 10 + colW / 2, tableTop + 3.2, 7.5, "#000000", true, "center");
    drawSmartText(doc, "DÉPART / الإنطلاق", 10 + colW * 1.5, tableTop + 3.2, 7.5, "#000000", true, "center");
    drawSmartText(doc, "RETOUR / الرجوع", 10 + colW * 2.5, tableTop + 3.2, 7.5, "#000000", true, "center");
    drawSmartText(doc, "PROLONGATION / تمديد", 10 + colW * 3.5, tableTop + 3.2, 7.5, "#000000", true, "center");

    const vehString = `${seg.brand || ""} ${seg.model || ""}`.trim();
    const regString = `${seg.registration || ""}`.trim() + " TU";

    const columnsData = [
      {
        colX: 10,
        rows: [
          { label: "Modèle", arabic: "نوع", val: vehString },
          { label: "Matricule", arabic: "لوحة", val: regString },
          { label: "Carb. Départ", arabic: "الوقود انطلاق", val: "FUEL_BAR_DEPART" },
          { label: "Carb. Retour", arabic: "الوقود رجوع", val: "FUEL_BAR_RETURN" }
        ]
      },
      {
        colX: 10 + colW,
        rows: [
          { label: "Date", arabic: "التاريخ", val: seg.start_date || "" },
          { label: "Lieu", arabic: "المكان", val: seg.departure_place || "" },
          { label: "Heure", arabic: "الوقت", val: seg.departure_time || "" },
          { label: "Klm départ", arabic: "الإنطلاق", val: seg.km_depart?.toString() || "" }
        ]
      },
      {
        colX: 10 + colW * 2,
        rows: [
          { label: "Date", arabic: "التاريخ", val: seg.end_date || "" },
          { label: "Lieu", arabic: "المكان", val: seg.return_place || "" },
          { label: "Heure", arabic: "الوقت", val: seg.return_time || "" },
          { label: "Klm retour", arabic: "الرجوع", val: seg.return_mileage?.toString() || "...................." }
        ]
      },
      {
        colX: 10 + colW * 3,
        rows: [
          { label: "Date", arabic: "التاريخ", val: seg.prolongation_date || "...................." },
          { label: "Lieu", arabic: "المكان", val: seg.prolongation_place || "...................." },
          { label: "Heure", arabic: "الوقت", val: seg.prolongation_time || "...................." },
          { label: "Klm retour", arabic: "الرجوع", val: "...................." }
        ]
      }
    ];

    // Draw each cell row in the dynamic table
    columnsData.forEach((col) => {
      col.rows.forEach((r, i) => {
        const rowY = tableTop + 8.2 + i * 4.2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(80, 80, 80);
        doc.text(r.label, col.colX + 1.5, rowY);
        drawSmartText(doc, r.arabic, col.colX + colW - 1.5, rowY, 5.8, "#555555", false, "right");
        
        if (r.val === "FUEL_BAR_DEPART" || r.val === "FUEL_BAR_RETURN") {
          const isDepart = r.val === "FUEL_BAR_DEPART";
          const fuelVal = isDepart ? seg.fuel_depart_bars : seg.fuel_return_bars;
          
          if (fuelVal !== undefined && fuelVal !== null && fuelVal !== "" && fuelVal !== "0" && fuelVal !== 0 && fuelVal !== "...................." && !isNaN(parseInt(String(fuelVal)))) {
            const fuelTotal = parseInt(String(seg.fuel_total_bars || rental.fuel_total_bars || 8)) || 8;
            const fuelBars = parseInt(String(fuelVal));
            let barW = 1.3;
            const barH = 3.2;
            let barGap = 0.5;

            // If there's more bars, scale them down slightly to fit the space (approx 15mm max)
            if (fuelTotal > 8) {
              const maxSpace = 15; // mm space
              barGap = 0.4;
              barW = (maxSpace - (fuelTotal - 1) * barGap) / fuelTotal;
              if (barW < 0.6) barW = 0.6; // safety floor width
            }
            
            const startFuelX = col.colX + 16;
            const fuelYVal = rowY - 2.5;

            for (let j = 0; j < fuelTotal; j++) {
              const x = startFuelX + j * (barW + barGap);
              if (j < fuelBars) {
                if (isDepart) {
                  doc.setFillColor(249, 115, 22); // Orange
                  doc.setDrawColor(234, 88, 12);
                } else {
                  doc.setFillColor(34, 197, 94); // Green
                  doc.setDrawColor(22, 163, 74);
                }
                doc.rect(x, fuelYVal, barW, barH, "FD");
              } else {
                doc.setFillColor(241, 245, 249);
                doc.setDrawColor(226, 232, 240);
                doc.rect(x, fuelYVal, barW, barH, "FD");
              }
            }
          } else {
            const placeholder = typeof fuelVal === 'string' ? fuelVal : "....................";
            drawSmartText(doc, placeholder, col.colX + 16, rowY, 6.8, "#000000", true, "left");
          }
        } else {
          drawSmartText(doc, r.val, col.colX + 11.5, rowY, 6.8, "#000000", true, "left");
        }
      });
    });

    currentY = tableTop + tableH;
  });

  currentY += 5.5;

  // --- KM STATISTICS (ONLY PARCOURU & FACTURÉS REMAIN HERE) ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Km Parcouru :", 40, currentY);
  doc.text("Km Facturés :", 120, currentY);

  doc.setFont("helvetica", "bold");
  doc.text(rental.km_parcouru?.toString() || "..................", 62, currentY);
  drawSmartText(doc, "المقطوعة", 62, currentY - 3.5, 7.5, "#000000", false, "center");

  doc.text(rental.km_factures?.toString() || "..................", 142, currentY);
  drawSmartText(doc, "المفوترة", 142, currentY - 3.5, 7.5, "#000000", false, "center");

  // --- KILOMETRAGE EXCESS DETAILS (RESTORED DEDICATED PHRASES) ---
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const kmLimit = rental.km_allowance || 280;
  const kmPrice = rental.excess_km_price || 0.5;
  doc.text(`Kilométrage : Le Kilométrage est limité à ${kmLimit} Km/jour tout excès est facturé à base de ${kmPrice * 1000} millimes / Km`, 105, currentY, { align: "center" });
  drawSmartText(doc, "يجب أن لا يتجاوز الكيلومتر المسموح به " + kmLimit + " كلم يوميا والزيادة تحتسب بـ " + (kmPrice * 1000) + " مليم عن كل كلم زائد", 105, currentY + 4, 8, "#000000", false, "center");

  currentY += 6;

  // --- LOWER BLOCKS (SPLIT DESIGN: LEFT LEGAL CLAUSES & RIGHT BILLING/CAUTION TABLES) ---
  const startBlockY = currentY;
  const colWidth = 92;

  // ==== RIGHT COLUMN: tables (Cautionnement and Facturation) ====
  const rightX = 108;
  const rightW = colWidth;

  const depositAmount = rental.deposit_amount ? parseFloat(String(rental.deposit_amount)) : 0;
  const hasCaution = depositAmount > 0;

  // 1. Cautionnement Box
  const cautionY = startBlockY;
  const cautionH = 17;
  doc.setDrawColor(0);
  doc.setLineWidth(0.15);
  doc.rect(rightX, cautionY, rightW, cautionH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Cautionnement", rightX + 2, cautionY + 4);
  drawSmartText(doc, "الضمان", rightX + rightW - 2, cautionY + 4, 8, "#000000", true, "right");

  const cautionFields = [
    { l: "Mode :", a: "طريقة الدفع", v: hasCaution ? (rental.payment_mode || "Espèces") : "" },
    { l: "Montant :", a: "مبلغ الضمان", v: hasCaution ? `${depositAmount.toFixed(3)} DT` : "" }
  ];

  cautionFields.forEach((f, i) => {
    const rowY = cautionY + 9 + i * 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(f.l, rightX + 2, rowY);
    drawSmartText(doc, f.a, rightX + rightW - 2, rowY, 7, "#000000", false, "right");
    drawSmartText(doc, f.v?.toString() || "", rightX + 28, rowY, 7, "#000000", true, "left");
  });

  // 2. Facturation Box underneath
  const factTop = cautionY + 20;
  const factH = 43;
  doc.setLineWidth(0.15);
  doc.rect(rightX, factTop, rightW, factH);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Facturation", rightX + 2, factTop + 4.5);
  drawSmartText(doc, "الفوترة", rightX + rightW - 2, factTop + 4.5, 8, "#000000", true, "right");

  // Check if daily price is provided and valid
  const dailyPrice = rental.daily_price ? parseFloat(rental.daily_price) : 0;
  const hasPrice = dailyPrice > 0;

  // Billing calculation values
  const startDate = new Date(rental.start_date || new Date());
  const endDate = new Date(rental.end_date || new Date());
  const diffDays = differenceInDays(endDate, startDate);
  
  const [startH, startM] = (rental.departure_time || "08:00").split(":").map(Number);
  const [endH, endM] = (rental.return_time || "08:00").split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const exceedsByOneHour = (endMinutes - startMinutes) >= 60;
  
  let autoDays = diffDays;
  if (diffDays === 0) {
    autoDays = exceedsByOneHour ? 2 : 1;
  } else {
    autoDays = exceedsByOneHour ? diffDays + 1 : diffDays;
  }
  
  const duration = rental.rental_days ? parseInt(rental.rental_days.toString()) : autoDays;
  const otherCharges = parseFloat(rental.other_charges || "0");
  
  // Backwards VAT calculation: base price includes VAT!
  const baseTTC = duration * dailyPrice + otherCharges;
  const vatRate = parseFloat(rental.vat || "19");
  const baseHT = baseTTC / (1 + (vatRate / 100));
  const vatAmount = baseTTC - baseHT;
  const stampDuty = parseFloat(rental.stamp_duty || "0.600");
  const totalFacture = baseTTC + stampDuty;

  const factFields = [
    { l: "Nom du client", a: "إسم الحريف", v: rental.customer_name },
    { l: "Matriculation Fiscale", a: "المعرف الجبائي", v: ".................." },
    { l: "Durée de location", a: "مدة الكراء", v: hasPrice ? `${duration} jours` : "" },
    { l: "Prix par jour", a: "سعر اليوم الواحد", v: hasPrice ? `${dailyPrice.toFixed(3)} DT` : "" },
    { l: "Autres Charges", a: "معاليم أخري", v: hasPrice ? `${otherCharges.toFixed(3)} DT` : "" },
    { l: "Total H.T", a: "المجموع بدون ضريبة", v: hasPrice ? `${baseHT.toFixed(3)} DT` : "" },
    { l: "TVA:", a: "ض.ق.م", v: hasPrice ? `${vatAmount.toFixed(3)} DT` : "" },
    { l: "Droit de Timbre", a: "الطابع الجبائي", v: hasPrice ? `${stampDuty.toFixed(3)} DT` : "" }
  ];

  factFields.forEach((f, i) => {
    const y = factTop + 9.5 + i * 3.4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(f.l, rightX + 2, y);
    drawSmartText(doc, f.a, rightX + rightW - 2, y, 7, "#000000", false, "right");
    let valStr = f.v?.toString() || "";
    if (f.l === "Nom du client" && valStr.length > 20) {
      valStr = valStr.substring(0, 18) + "...";
    }
    drawSmartText(doc, valStr, rightX + 28, y, 7, "#000000", true, "left");
  });

  doc.line(rightX, factTop + 37.5, rightX + rightW, factTop + 37.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Total Facture", rightX + 2, factTop + 41);
  drawSmartText(doc, "المجموع العام", rightX + rightW - 2, factTop + 41, 7.5, "#000000", true, "right");
  const totalFactureStr = hasPrice ? `${totalFacture.toFixed(3)} DT` : "..................";
  doc.text(totalFactureStr, rightX + 28, factTop + 41);

  // Directly below Facturation Table on the right
  let extraRightY = factTop + factH + 4;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  const rightText = doc.splitTextToSize("Le locataire soussigné accepte sans réserve les conditions générales de location figurant au verso dont il a pris connaissance et s'engage à s'y conformer et restituer le véhicule à la date prévue ci-dessus.", colWidth);
  doc.text(rightText, 108, extraRightY);
  extraRightY += rightText.length * 3.2 + 3;

  doc.setFont("helvetica", "bold");
   const connectedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;
   const preparerName = preparedBy || rental?.creator_name || rental?.prepared_by || connectedUser?.name || "";
   if (preparerName) {
     drawSmartText(doc, `Contrat préparé par : ${preparerName}`, 108, extraRightY, 7.5, "#000000", true);
   } else {
     drawSmartText(doc, "Contrat préparé par : ...................................", 108, extraRightY, 7.5, "#000000", true);
   }
  extraRightY += 4.5;


  // ==== LEFT COLUMN: Legal clauses ====
  const leftX = 10;
  let leftY = startBlockY + 1;

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.text("Par l'apposition de sa signature, le locataire :", leftX, leftY);
  leftY += 3.5;

  doc.text("Certifie :", leftX, leftY);
  leftY += 3.5;

  doc.setFont("helvetica", "normal");
  const cert1 = doc.splitTextToSize("* Que les informations mentionnées ci-dessus sont exactes.", colWidth);
  doc.text(cert1, leftX + 2, leftY);
  leftY += cert1.length * 3.2;

  const cert2 = doc.splitTextToSize("* Être en possession d'un permis de conduire valide.", colWidth);
  doc.text(cert2, leftX + 2, leftY);
  leftY += cert2.length * 3.2;

  const cert3 = doc.splitTextToSize("* Autorise le loueur à recouvrer le montant de la franchise et des frais accessoires au moyen de la carte de crédit dont l'empreinte est reprise sur ce contrat.", colWidth);
  doc.text(cert3, leftX + 2, leftY);
  leftY += cert3.length * 3.2;

  leftY += 1.5;
  doc.setFont("helvetica", "bold");
  doc.text("Reconnaît :", leftX, leftY);
  leftY += 3.5;

  doc.setFont("helvetica", "normal");
  const rec1 = doc.splitTextToSize("* Avoir pris connaissance et accepter les conditions stipulées ci-dessus ainsi que les conditions générales de location figurant à la dernière page de contrat de location.", colWidth);
  doc.text(rec1, leftX + 2, leftY);
  leftY += rec1.length * 3.2;

  const rec2 = doc.splitTextToSize("* Sa responsabilité pour toute contravention relative à la circulation routière et au stationnement.", colWidth);
  doc.text(rec2, leftX + 2, leftY);
  leftY += rec2.length * 3.2;

  const rec3 = doc.splitTextToSize("* Avoir reçu les documents administratifs ainsi que la notice d'usage.", colWidth);
  doc.text(rec3, leftX + 2, leftY);
  leftY += rec3.length * 3.2;


  // ==== BOTTOM SIGNATURES SECTION ====
  // Position signatures beautifully after BOTH columns to stay clear of overlap
  const maxColumnY = Math.max(leftY, extraRightY);
  currentY = maxColumnY + 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  // Date and Arabic text
  doc.text(`Le : ${format(new Date(), 'dd/MM/yyyy')}`, 10, currentY);
  drawSmartText(doc, "إطلعت على المعلومات و الشروط الموجودة أعلاه و في الخلف و وافقت عليها", 200, currentY, 8, "#000000", true, "right");

  currentY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Signature (Lu & Approuvé)", 105, currentY, { align: "center" });

  currentY += 5;
  doc.text("1er Conducteur", 45, currentY, { align: "center" });
  doc.text("2ème Conducteur", 165, currentY, { align: "center" });



 
    const rawId = String(rental.contract_number || rental.id || "PREVIEW");
    const cleanId = rawId.replace(/[^a-zA-Z0-9_\-]/g, "");
    const rawName = String(rental.customer_name || "Client");
    let safeCustomerName = rawName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim();
    if (!safeCustomerName) {
      safeCustomerName = "Client";
    }
    doc.save(`Contrat_${cleanId}_${safeCustomerName}.pdf`);
  } catch (error: any) {
    console.error("Erreur de génération du PDF (Contrat):", error);
    toast.error("Erreur de génération du PDF (Contrat): " + error.message);
  }
};


function convertNumberToFrenchWords(amount: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];
  
  const formatGroup = (n: number): string => {
    if (n === 0) return "";
    let res = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (h > 0) {
      if (h === 1) res += "cent ";
      else res += units[h] + " cent ";
    }
    
    if (t > 0) {
      if (t === 1) {
        res += teens[u] + " ";
      } else if (t === 7) {
        res += "soixante-" + teens[u] + " ";
      } else if (t === 9) {
        res += "quatre-vingt-" + teens[u] + " ";
      } else {
        res += tens[t] + " ";
        if (u === 1) res += "et un ";
        else if (u > 1) res += units[u] + " ";
      }
    } else if (u > 0) {
      res += units[u] + " ";
    }
    return res.trim();
  };

  const dinars = Math.floor(amount);
  const millimes = Math.round((amount - dinars) * 1000);
  
  let dStr = "";
  if (dinars === 0) {
    dStr = "zéro Dinar";
  } else {
    const thousands = Math.floor(dinars / 1000);
    const thousandsRest = dinars % 1000;
    
    if (thousands > 0) {
      if (thousands === 1) dStr += "mille ";
      else dStr += formatGroup(thousands) + " mille ";
    }
    if (thousandsRest > 0) {
      dStr += formatGroup(thousandsRest) + " ";
    }
    dStr += dinars > 1 ? "Dinars" : "Dinar";
  }
  
  if (millimes > 0) {
    dStr += " et " + formatGroup(millimes) + " " + (millimes > 1 ? "Millimes" : "Millime");
  }
  
  return dStr.trim().charAt(0).toUpperCase() + dStr.trim().slice(1);
}

function drawLocationIcon(doc: any, x: number, y: number) {
  doc.setFillColor(192, 0, 0); // Red
  doc.circle(x, y - 1, 2.2, "F");
  doc.setFillColor(255, 255, 255); // White inner circle
  doc.circle(x, y - 1, 0.9, "F");
  // Triangle pointing down
  doc.setFillColor(192, 0, 0);
  doc.triangle(x - 1.6, y + 0.3, x + 1.6, y + 0.3, x, y + 2.8, "F");
}

function drawPhoneIcon(doc: any, x: number, y: number) {
  doc.setFillColor(31, 78, 121); // Blue
  doc.circle(x, y - 1, 2.2, "F");
  doc.setLineWidth(0.4);
  doc.setDrawColor(255, 255, 255);
  // Curved handset line
  doc.line(x - 1.1, y - 1.8, x + 1.1, y + 0.4);
  // Handset endpoints
  doc.setFillColor(255, 255, 255);
  doc.circle(x - 1.1, y - 1.8, 0.4, "F");
  doc.circle(x + 1.1, y + 0.4, 0.4, "F");
}

function drawEmailIcon(doc: any, x: number, y: number) {
  doc.setFillColor(31, 78, 121); // Blue
  doc.circle(x, y - 1, 2.2, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  // Envelope body
  doc.rect(x - 1.4, y - 2, 2.8, 2.0, "D");
  // Flap folds
  doc.line(x - 1.4, y - 2, x, y - 1);
  doc.line(x + 1.4, y - 2, x, y - 1);
}

function drawMFIcon(doc: any, x: number, y: number) {
  doc.setFillColor(31, 78, 121); // Blue
  doc.circle(x, y - 1, 2.2, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  // Document representation
  doc.rect(x - 1.3, y - 2.1, 2.6, 2.2, "D");
  // Inside text lines
  doc.line(x - 0.7, y - 1.5, x + 0.7, y - 1.5);
  doc.line(x - 0.7, y - 0.9, x + 0.7, y - 0.9);
}

export const generateInvoicePDF = (customer: any, rentals: any[], settings: any) => {
  try {
    const doc = new jsPDF();
    
    const COMPANY_INFO = {
    name: settings?.company_name || "THM RENT A CAR",
    address: settings?.company_address || "Rue Habib Thameur, Bizerte 7000/ 17 Rue Osmane Bhri, Tunis 2045",
    mobile: settings?.company_phone || "20 336 278 / 99 336 216",
    whatsapp: settings?.company_whatsapp || "58 599 171",
    email: settings?.company_email || "thmrent@outlook.com",
    mf: settings?.company_mf || "18 18 69 8 /Y/A/M/000"
  };

  // 1. TOP CORPORATE GEOMETRIC DESIGN (Matches the red and dark charcoal triangles perfectly)
  // Top thin red band
  doc.setFillColor(192, 0, 0);
  doc.rect(0, 0, 210, 6, "F");

  // Top-right dark grey triangle
  doc.setFillColor(31, 41, 55);
  doc.triangle(140, 0, 210, 0, 175, 32, "F");
  doc.triangle(210, 0, 210, 32, 175, 32, "F");

  // Overlapping red triangular corner
  doc.setFillColor(192, 0, 0);
  doc.triangle(185, 0, 210, 0, 210, 15, "F");

  // Top left horizontal-to-slanted red bar
  doc.setFillColor(192, 0, 0);
  doc.rect(0, 14, 80, 10, "F");
  doc.triangle(80, 14, 85, 14, 80, 24, "F");
  doc.triangle(85, 14, 95, 24, 80, 24, "F");

  // Draw Logo (if exists, or fall back to the asset logo)
  try {
    doc.addImage(logoTHM, "PNG", 30, 15, 52, 11);
  } catch (e) {
    console.error("Error adding logoTHM from assets, attempting fallback to settings logo", e);
    if (settings?.company_logo) {
      try {
        doc.addImage(settings.company_logo, "PNG", 30, 15, 52, 11);
      } catch (err) {
        console.error("Error adding settings fallback logo", err);
      }
    }
  }

  // 2. LARGE FACTURE TITLE
  drawSmartText(doc, "FACTURE", 105, 46, 26, "#C00000", true, "center");

  // 3. FACTURE INFO & CLIENT BLOCK
  // Left: Invoice details
  const currentYear = new Date().getFullYear();
  const groupedRental = rentals.find(r => r.lease_group_number);
  let invoiceNumber = `F-${currentYear}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  if (groupedRental && groupedRental.lease_group_number) {
    invoiceNumber = `${groupedRental.lease_group_number} / ${currentYear}`;
  } else if (rentals.length === 1 && rentals[0].contract_number) {
    invoiceNumber = rentals[0].contract_number;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text("Facture N° :", 15, 58);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceNumber, 45, 58);

  doc.setFont("helvetica", "normal");
  doc.text("Date :", 15, 65);
  doc.setFont("helvetica", "bold");
  doc.text(format(new Date(), "dd/MM/yyyy"), 40, 65);

  // Right: Client Box (Clean text lines matching Facture N° and Date without a frame)
  const clientBoxX = 108;
  const fullName = customer.type === "company" ? customer.name : `${customer.name || ""} ${customer.first_name || ""}`;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Client", clientBoxX, 52);

  doc.setFontSize(9);
  
  doc.setFont("helvetica", "normal");
  doc.text("Client :", clientBoxX, 58);
  drawSmartText(doc, fullName, clientBoxX + 13, 58, 9.5, "#000000", true);

  doc.setFont("helvetica", "normal");
  doc.text("Adresse :", clientBoxX, 65);
  drawSmartText(doc, customer.address || "TUNISIE", clientBoxX + 17, 65, 9, "#000000");

  doc.setFont("helvetica", "normal");
  doc.text("Matricule Fiscal :", clientBoxX, 72);
  drawSmartText(doc, customer.id_number || "..................................................", clientBoxX + 27, 72, 9, "#000000");

  doc.setFont("helvetica", "normal");
  doc.text("Téléphone :", clientBoxX, 79);
  drawSmartText(doc, customer.phone || "............................................", clientBoxX + 21, 79, 9, "#000000");

  // 4. MAIN ITEMS GRID (Replicating exact layout of the photo list table)
  const tabTop = 92;
  const tabHeight = Math.max(72, 12 + rentals.length * 13 + 18);
  const obsY = tabTop + tabHeight - 16;
  
  // Outer table frame
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(10, tabTop, 190, tabHeight, "D");

  // Header horizontal divider line
  doc.line(10, tabTop + 8, 200, tabTop + 8);

  // Column definitions for vertical gridlines
  // Description: 10->85 (75), Immat: 85->120 (35), Du: 120->141 (21), Au: 141->162 (21), Nbj: 162->177 (15), Prix HT: 177->200 (23)
  const colLines = [85, 120, 141, 162, 177];
  colLines.forEach(lx => {
    if (lx === 85 || lx === 120 || lx === 141) {
      doc.line(lx, tabTop, lx, obsY); // Stop at observation row
    } else {
      doc.line(lx, tabTop, lx, tabTop + tabHeight); // Extends fully to bottom
    }
  });

  // Table header labels
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Description", (10 + 85) / 2, tabTop + 5.2, { align: "center" });
  doc.text("Immatriculation", (85 + 120) / 2, tabTop + 5.2, { align: "center" });
  doc.text("Du", (120 + 141) / 2, tabTop + 5.2, { align: "center" });
  doc.text("Au", (141 + 162) / 2, tabTop + 5.2, { align: "center" });
  doc.text("Nbj", (162 + 177) / 2, tabTop + 5.2, { align: "center" });
  doc.text("Prix HT", (177 + 200) / 2, tabTop + 5.2, { align: "center" });

  // Compute rentals content
  // Note: TVA 19% is ALREADY included in daily_price. HT is backwards calculated.
  let currentItemY = tabTop + 14;
  
  rentals.forEach((r, idx) => {
    if (currentItemY > tabTop + tabHeight - 15) return; // Prevent overflow
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // Columns values
    const descLine1 = `Contrat de location N° ${r.contract_number || r.id}`;
    const descLine2 = `- Location de voiture ${r.brand} ${r.model}`;

    drawSmartText(doc, descLine1, 12, currentItemY, 8, "#000000", false);
    drawSmartText(doc, descLine2, 14, currentItemY + 4, 8, "#000000", false);

    drawSmartText(doc, r.registration || "N/A", (85 + 120) / 2, currentItemY + 4, 8, "#000000", false, "center");
    
    const dStr = r.start_date ? format(parseISO(r.start_date), "dd/MM/yyyy") : "";
    drawSmartText(doc, dStr, (120 + 141) / 2, currentItemY + 4, 8, "#000000", false, "center");

    const aStr = r.end_date ? format(parseISO(r.end_date), "dd/MM/yyyy") : "";
    drawSmartText(doc, aStr, (141 + 162) / 2, currentItemY + 4, 8, "#000000", false, "center");

    const [startH, startM] = (r.departure_time || "08:00").split(":").map(Number);
    const [endH, endM] = (r.return_time || "08:00").split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const exceedsByOneHour = (endMinutes - startMinutes) >= 60;
    const rawDiff = differenceInDays(parseISO(r.end_date), parseISO(r.start_date));
    let fallbackDur = rawDiff;
    if (rawDiff === 0) {
      fallbackDur = exceedsByOneHour ? 2 : 1;
    } else {
      fallbackDur = exceedsByOneHour ? rawDiff + 1 : rawDiff;
    }
    const dur = r.rental_days ? parseInt(r.rental_days.toString()) : fallbackDur;
    drawSmartText(doc, dur.toString(), (162 + 177) / 2, currentItemY + 4, 8, "#000000", false, "center");

    // The Prix HT column: Backwards computed HT price per day
    const itemDailyTTC = parseFloat(r.daily_price || 0);
    const itemDailyHT = itemDailyTTC / 1.19;
    drawSmartText(doc, itemDailyHT.toFixed(3), 198, currentItemY + 4, 8, "#000000", false, "right");

    currentItemY += 13;
  });

  // 5. OBSERVATION TABLE CELL at the bottom of the grid
  doc.line(10, obsY, 162, obsY); // Header of observation line: only spans from 10 to 162 (Columns 1 to 4)

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Observation", 12, obsY + 4);

  // 6. BOTTOM SECTIONS: ARRETE NOTE, CACHET AND TOTALS TABLE
  const lowerY = tabTop + tabHeight + 8;

  // Let's calculate the totals mathematically from rentals
  const subtotalTTC = rentals.reduce((acc, r) => acc + parseFloat(r.total_price || 0), 0);
  const vatRate = settings?.vat || 19;
  const totalHT = subtotalTTC / (1 + vatRate / 100);
  const totalVAT = subtotalTTC - totalHT;
  const divers = 0.000; // Placeholders for other modifications
  const stampDuty = settings?.stamp_duty || 1.000;
  const finalTotalTTC = subtotalTTC + stampDuty;

  // Bottom Left: Arrête la présente facture & Cachet block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Arrêté la présente facture à la somme de", 10, lowerY + 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const frenchWords = convertNumberToFrenchWords(finalTotalTTC);
  doc.text(frenchWords, 10, lowerY + 7);

  // Large Watermark Behind Signature Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(55);
  doc.setTextColor(245, 225, 225); // Soft red watermark pink
  doc.text("THM", 45, lowerY + 45, { align: "center" });

  // Cachet and signature Box
  const sigBoxX = 22;
  const sigBoxY = lowerY + 12;
  const sigBoxW = 55;
  const sigBoxH = 18;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(sigBoxX, sigBoxY, sigBoxW, sigBoxH, "D"); // Signature box

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Cachet et signature", sigBoxX + sigBoxW / 2, sigBoxY + 5, { align: "center" });

  // Bottom Right: Totals Table (Grid elements)
  const totalsBoxX = 120;
  const totalsBoxY = lowerY;
  const totalsBoxW = 80;
  const totalsRowH = 6;
  
  doc.setLineWidth(0.2);
  doc.setDrawColor(0);
  
  // Draw totals rows
  const totalsRows = [
    { label: "Total HT", val: `${totalHT.toFixed(3)}` },
    { label: "TVA", val: `${totalVAT.toFixed(3)}` },
    { label: "Divers", val: `${divers.toFixed(3)}` },
    { label: "Timbre", val: `${stampDuty.toFixed(3)}` },
    { label: "Total TTC", val: `${finalTotalTTC.toFixed(3)}` },
    { label: "Mode de paiement", val: `${rentals[0]?.payment_mode || "Espèces"}` }
  ];

  doc.rect(totalsBoxX, totalsBoxY, totalsBoxW, totalsRowH * totalsRows.length, "D");
  doc.line(totalsBoxX + 40, totalsBoxY, totalsBoxX + 40, totalsBoxY + totalsRowH * totalsRows.length);

  totalsRows.forEach((row, rIdx) => {
    const currentYVal = totalsBoxY + rIdx * totalsRowH;
    if (rIdx > 0) {
      doc.line(totalsBoxX, currentYVal, totalsBoxX + totalsBoxW, currentYVal);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(row.label, totalsBoxX + 4, currentYVal + 4.2);
    
    doc.setFont("helvetica", "normal");
    if (row.label === "Total TTC") {
      doc.setFont("helvetica", "bold");
    }
    doc.text(row.val, totalsBoxX + 44, currentYVal + 4.2);
  });

  // 7. BOTTOM DOUBLE STRIPE FOOTER
  const footerY = 270;
  
  // Red accent bar
  doc.setFillColor(192, 0, 0);
  doc.rect(0, footerY - 5, 210, 5, "F");

  // Elegant dark charcoal information bottom footer
  doc.setFillColor(31, 41, 55);
  doc.rect(0, footerY, 210, 27, "F");

  // Footer textual information beautifully mapped
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");

  // Custom high precision vector icons and exact textual placement
  drawLocationIcon(doc, 15, footerY + 8);
  doc.text("Rue Habib Thameur, Bizerte 7000/ 17 Rue Osmane Bhri, Tunis 2045", 21, footerY + 9);

  drawPhoneIcon(doc, 120, footerY + 8);
  doc.text("20 336 278 / 99 336 216 - 58 599 171 (WhatsApp)", 126, footerY + 9);

  drawEmailIcon(doc, 15, footerY + 17);
  doc.text("thmrent@outlook.com", 21, footerY + 18);

  drawMFIcon(doc, 120, footerY + 17);
  doc.text("MF : 18 18 69 8 /Y/A/M/000", 126, footerY + 18);

    const rawName = String(fullName || "Client");
    let safeCustomerName = rawName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    if (!safeCustomerName) {
      safeCustomerName = "Client";
    }
    const filename = `Facture_${safeCustomerName}_${format(new Date(), "ddMMyy")}.pdf`;
    doc.save(filename);
  } catch (error: any) {
    console.error("Erreur de génération du PDF (Facture):", error);
    toast.error("Erreur de génération du PDF (Facture): " + error.message);
  }
};

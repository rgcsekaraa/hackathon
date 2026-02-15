export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

export interface Appointment {
  id: string;
  title: string;
  client: string;
  time: string;
  duration: string;
  status: "confirmed" | "pending" | "cancelled";
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  subject: string;
  summary: string;
  status: "new" | "pending" | "responded" | "closed";
  receivedAt: string;
}

export interface ChargeLineItem {
  label: string;
  amount: number;
  note?: string;
}

export interface IncomingEnquiryPush {
  id: string;
  customerName: string;
  customerPhone: string;
  requestSummary: string;
  category: string;
  location: string;
  distanceKm: number;
  imageAnalysis?: string;
  charges: ChargeLineItem[];
  totalEstimate: number;
  suggestedTime: string;
  suggestedDate: string;
}

export const sampleIncomingEnquiry: IncomingEnquiryPush = {
  id: "push-1",
  customerName: "Sarah Mitchell",
  customerPhone: "+61 412 345 678",
  requestSummary:
    "Kitchen tap is leaking from the base. Customer sent photos -- appears to be a worn cartridge seal on a standard mixer tap.",
  category: "Plumbing -- Tap Repair",
  location: "42 Palm Beach Ave, Burleigh Heads QLD",
  distanceKm: 12.4,
  imageAnalysis:
    "Standard single-lever mixer tap, chrome finish. Visible water pooling at base suggests cartridge seal failure. Replacement cartridge compatible: Bunnings SKU #0348762.",
  charges: [
    { label: "Service call fee", amount: 85, note: "Standard callout" },
    { label: "Tap cartridge", amount: 34, note: "Bunnings price" },
    { label: "Labour (est. 45 min)", amount: 120 },
    { label: "Travel (12.4 km)", amount: 25, note: "Distance charge" },
  ],
  totalEstimate: 264,
  suggestedTime: "02:30 PM",
  suggestedDate: "Today",
};

export const sampleIncomingEnquiry2: IncomingEnquiryPush = {
  id: "push-2",
  customerName: "James Cooper",
  customerPhone: "+61 423 987 654",
  requestSummary:
    "Power outlet in living room stopped working. No visible damage. Breaker hasn't tripped.",
  category: "Electrical -- Outlet Repair",
  location: "18 Surf Parade, Miami QLD",
  distanceKm: 8.2,
  charges: [
    { label: "Service call fee", amount: 95, note: "Electrical callout" },
    { label: "Diagnostic & testing", amount: 60 },
    { label: "Parts (if needed)", amount: 40, note: "Estimated" },
    { label: "Travel (8.2 km)", amount: 18, note: "Distance charge" },
  ],
  totalEstimate: 213,
  suggestedTime: "04:00 PM",
  suggestedDate: "Today",
};

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "New enquiry received",
    body: "Sarah Mitchell sent an enquiry about a leaking tap in Burleigh Heads",
    time: "2m ago",
    read: false,
    type: "info",
  },
  {
    id: "n2",
    title: "Appointment confirmed",
    body: "Priya Patel confirmed the 2:30 PM meeting",
    time: "15m ago",
    read: false,
    type: "success",
  },
  {
    id: "n3",
    title: "Missed call",
    body: "You missed a call from Amit Kumar",
    time: "1h ago",
    read: true,
    type: "warning",
  },
  {
    id: "n4",
    title: "Enquiry follow-up due",
    body: "Follow-up with Sanjay Gupta is overdue by 2 days",
    time: "3h ago",
    read: true,
    type: "warning",
  },
];

export const todayAppointments: Appointment[] = [
  {
    id: "a1",
    title: "Product Demo",
    client: "Rahul Sharma",
    time: "09:00 AM",
    duration: "30 min",
    status: "confirmed",
  },
  {
    id: "a2",
    title: "Follow-up Call",
    client: "Priya Patel",
    time: "11:00 AM",
    duration: "15 min",
    status: "confirmed",
  },
  {
    id: "a3",
    title: "Consultation",
    client: "Amit Kumar",
    time: "02:30 PM",
    duration: "45 min",
    status: "pending",
  },
  {
    id: "a4",
    title: "Contract Review",
    client: "Sanjay Gupta",
    time: "04:00 PM",
    duration: "1 hr",
    status: "confirmed",
  },
  {
    id: "a5",
    title: "Quick Sync",
    client: "Neha Verma",
    time: "05:30 PM",
    duration: "15 min",
    status: "cancelled",
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "c1", title: "Team Standup", date: "2026-02-15", time: "09:00", color: "#8AB4F8" },
  { id: "c2", title: "Client Call", date: "2026-02-15", time: "11:00", color: "#81C995" },
  { id: "c3", title: "Lunch", date: "2026-02-15", time: "13:00", color: "#FDD663" },
  { id: "c4", title: "Review Meeting", date: "2026-02-16", time: "10:00", color: "#8AB4F8" },
  { id: "c5", title: "1:1 with Manager", date: "2026-02-16", time: "15:00", color: "#F28B82" },
  { id: "c6", title: "Sprint Planning", date: "2026-02-17", time: "09:30", color: "#8AB4F8" },
  { id: "c7", title: "Design Review", date: "2026-02-18", time: "14:00", color: "#81C995" },
  { id: "c8", title: "All Hands", date: "2026-02-19", time: "11:00", color: "#C58AF9" },
  { id: "c9", title: "Retrospective", date: "2026-02-20", time: "16:00", color: "#FDD663" },
];

export const enquiries: Enquiry[] = [
  {
    id: "e1",
    name: "Sarah Mitchell",
    phone: "+61 412 345 678",
    subject: "Leaking kitchen tap in Burleigh Heads",
    summary:
      "Kitchen tap leaking from the base. Photos analysed -- worn cartridge seal on a standard mixer tap. Replacement part available at Bunnings.",
    status: "new",
    receivedAt: "10 min ago",
  },
  {
    id: "e2",
    name: "James Cooper",
    phone: "+61 423 987 654",
    subject: "Power outlet not working",
    summary:
      "Living room outlet stopped working. No visible damage, breaker hasn't tripped. Likely internal wiring issue.",
    status: "pending",
    receivedAt: "2 hr ago",
  },
  {
    id: "e3",
    name: "Amit Kumar",
    phone: "+91 76543 21098",
    subject: "Partnership opportunity",
    summary:
      "Proposes a distribution partnership in the Northern region. Has an existing network of 50+ retailers.",
    status: "responded",
    receivedAt: "Yesterday",
  },
  {
    id: "e4",
    name: "Sanjay Gupta",
    phone: "+91 65432 10987",
    subject: "Technical support needed",
    summary:
      "Facing installation issues with the latest firmware update. Needs remote technical assistance.",
    status: "pending",
    receivedAt: "Yesterday",
  },
  {
    id: "e5",
    name: "Neha Verma",
    phone: "+91 54321 09876",
    subject: "Feedback on recent purchase",
    summary:
      "Very satisfied with the product. Wants to share a testimonial and inquire about the referral program.",
    status: "closed",
    receivedAt: "3 days ago",
  },
];

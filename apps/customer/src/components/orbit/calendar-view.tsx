"use client";

import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

import { OrbitLoader } from "@/lib/orbit-ui";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { components, connectionStatus } = useWorkspace();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarEvents = useMemo(() => {
    return components.map(c => ({
      id: c.id,
      title: c.title,
      date: c.date || today.toISOString().split("T")[0],
      time: c.timeSlot || "09:00",
      color: c.priority === "urgent" ? "#F28B82" : 
             c.priority === "high" ? "#FDD663" : "#8AB4F8"
    } as CalendarEvent));
  }, [components, today]);

  const eventsForSelected = useMemo(
    () => calendarEvents.filter((e) => e.date === selectedDate),
    [selectedDate, calendarEvents]
  );

  const eventDates = useMemo(() => new Set(calendarEvents.map((e) => e.date)), [calendarEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (connectionStatus === "connecting") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <OrbitLoader />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      {/* Month nav */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 3, pb: 1 }}>
        <IconButton size="small" onClick={prevMonth} aria-label="Previous month" sx={{ color: "text.secondary" }}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
          {monthLabel}
        </Typography>
        <IconButton size="small" onClick={nextMonth} aria-label="Next month" sx={{ color: "text.secondary" }}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", px: 1.5, mb: 0.5 }}>
        {DAYS.map((d) => (
          <Box key={d} sx={{ textAlign: "center", py: 0.75 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 600 }}>
              {d}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", px: 1.5, gap: 0.25 }}>
        {cells.map((day, i) => {
          if (day === null) return <Box key={`empty-${i}`} />;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today.toISOString().split("T")[0];
          const isSelected = dateStr === selectedDate;
          const hasEvent = eventDates.has(dateStr);

          return (
            <Box
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedDate(dateStr); }}
              aria-label={`${day}, ${hasEvent ? "has events" : "no events"}`}
              aria-selected={isSelected}
              sx={{
                textAlign: "center",
                py: 1,
                cursor: "pointer",
                borderRadius: 2,
                position: "relative",
                bgcolor: isSelected
                  ? isDark ? "rgba(138,180,248,0.15)" : "rgba(26,115,232,0.1)"
                  : "transparent",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: isToday ? "primary.main" : "text.primary",
                  fontWeight: isToday ? 700 : 400,
                  fontSize: "0.85rem",
                }}
              >
                {day}
              </Typography>
              {hasEvent && (
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    mx: "auto",
                    mt: 0.25,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ borderColor: "divider", mx: 2, mt: 2, mb: 1 }} />

      {/* Events for selected date */}
      <Box sx={{ px: 2, pb: 0.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", fontWeight: 500 }}>
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </Typography>
      </Box>

      {eventsForSelected.length === 0 ? (
        <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            No events scheduled
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ px: 1 }}>
          {eventsForSelected.map((ev) => (
            <ListItemButton
              key={ev.id}
              sx={{
                py: 1.5,
                px: 2,
                my: 0.5,
                borderRadius: 2,
                borderLeft: 3,
                borderColor: ev.color,
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                },
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 500 }}>
                  {ev.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", mt: 0.25 }}>
                  {ev.time}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

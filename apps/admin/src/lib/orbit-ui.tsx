import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Card, { type CardProps } from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";

interface OrbitCardProps extends CardProps {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export function OrbitCard({ title, description, headerAction, children, ...props }: OrbitCardProps) {
  return (
    <Card variant="outlined" {...props}>
      {(title || description || headerAction) && (
        <CardHeader title={title} subheader={description} action={headerAction} />
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OrbitButton(props: ButtonProps) {
  return <Button variant="outlined" {...props} />;
}

export function OrbitLoader({ className }: { className?: string }) {
  return (
    <Box
      className={className}
      sx={{
        minHeight: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={22} />
    </Box>
  );
}

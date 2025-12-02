import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./config/supabase";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Grid from "@mui/material/Grid";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import LinearProgress from "@mui/material/LinearProgress";

import { useSettings } from "./SettingsGlobal";

type Account = {
  account_id: string;
  name?: string;
  type?: string;
  subtype?: string;
  mask?: string;
  currency?: string;
  current_balance?: number | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { userName, darkMode, highContrast } = useSettings();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;
        if (!userId) {
          setAccounts([]);
          setLoading(false);
          return;
        }

        const resp = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api/plaid/accounts?user_id=${encodeURIComponent(
            userId
          )}`
        );
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error ?? "Failed to fetch accounts");

        setAccounts(json.data ?? []);
      } catch (err) {
        console.error("Failed to load accounts:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  };

  // Theme-aware colors
  const containerBg = darkMode ? "#1e1e1e" : "#fff";
  const containerBorder = darkMode ? "#333" : "#e0e0e0";
  const textPrimary = darkMode ? "#fff" : "#1a1a1a";
  const textSecondary = darkMode ? "#bbb" : "#666";

  const pieColors = highContrast
    ? ["#555", "#888", "#aaa", "#ccc", "#eee"]
    : ["#0b5cff", "#4caf50", "#f44336", "#ff9800", "#9c27b0"];

  const barColors = highContrast
    ? { income: "#888", expenses: "#555" }
    : { income: "#4caf50", expenses: "#f44336" };

  const pieData = accounts.map((a, idx) => ({
    id: idx,
    value: a.current_balance || 0,
    label: a.name || "Account",
    color: pieColors[idx % pieColors.length],
  }));

  const cashFlow = [
    { month: "Jan", income: 3000, expenses: 2200 },
    { month: "Feb", income: 3200, expenses: 2500 },
    { month: "Mar", income: 2800, expenses: 2600 },
  ];

  // Example budget goals
  const budgetGoals = [
    { name: "Emergency Fund", progress: 60 },
    { name: "Vacation Savings", progress: 30 },
    { name: "Retirement Fund", progress: 45 },
  ];

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" color={textPrimary}>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color={textSecondary}>
            {userName
              ? `Welcome back, ${userName}!`
              : "Welcome! You can set your name in Settings to personalize your dashboard."}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={handleSignOut}
          disabled={signingOut}
          sx={{ textTransform: "none", color: textPrimary, borderColor: containerBorder }}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </Button>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Account Distribution */}
        <Grid size={{xs:12,  md: 6}}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              minHeight: 400,
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${containerBorder}`,
              bgcolor: containerBg,
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2} color={textPrimary}>
              Account Distribution
            </Typography>
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <CircularProgress />
              ) : accounts.length === 0 ? (
                <Typography color={textSecondary}>No accounts linked.</Typography>
              ) : (
                <PieChart
                  series={[
                    {
                      data: pieData.map((d) => ({ ...d, color: d.color })),
                      highlightScope: { fade: "global", highlight: "item" },
                    },
                  ]}
                  width={350}
                  height={300}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Budget Health */}
        <Grid size={{xs:12,  md: 6}}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              minHeight: 400,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${containerBorder}`,
              bgcolor: containerBg,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={3} color={textPrimary}>
              Budget Health
            </Typography>
            <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
              <CircularProgress
                size={160}
                thickness={4}
                value={75}
                variant="determinate"
                sx={{ color: highContrast ? "#888" : "#4caf50" }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h4" fontWeight="bold" color={textPrimary}>
                  75%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" color={textSecondary}>
              Healthy
            </Typography>
          </Paper>
        </Grid>

        {/* Cash Flow */}
        <Grid size={{xs:12,  md: 6}}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              minHeight: 400,
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${containerBorder}`,
              bgcolor: containerBg,
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2} color={textPrimary}>
              Cash Flow Summary
            </Typography>
            <Box sx={{ flexGrow: 1, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart
                xAxis={[{ scaleType: "band", data: cashFlow.map((d) => d.month) }]}
                series={[
                  {
                    data: cashFlow.map((d) => d.income),
                    label: "Income",
                    color: barColors.income,
                  },
                  {
                    data: cashFlow.map((d) => d.expenses),
                    label: "Expenses",
                    color: barColors.expenses,
                  },
                ]}
                width={450}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Budget Goals */}
        <Grid size={{xs:12,  md: 6}}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              minHeight: 400,
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${containerBorder}`,
              bgcolor: containerBg,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2} color={textPrimary}>
              Budget Goals
            </Typography>
            <List sx={{ flexGrow: 1, overflowY: "auto" }}>
              {budgetGoals.map((goal, idx) => (
                <ListItem key={idx} sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}>
                  <Typography color={textPrimary}>{goal.name}</Typography>
                  <Box sx={{ width: "100%", mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progress}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: darkMode ? "#333" : "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: highContrast ? "#888" : "#0b5cff",
                        },
                      }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid size={{xs:12,  md: 6}}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              border: `1px solid ${containerBorder}`,
              bgcolor: containerBg,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2} color={textPrimary}>
              Recommendations & Alerts
            </Typography>
            <List sx={{ py: 0 }}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Typography color={textPrimary}>• You are overspending in Dining by 14%.</Typography>
              </ListItem>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Typography color={textPrimary}>• Consider increasing your savings rate by 5%.</Typography>
              </ListItem>
              <ListItem sx={{ px: 0, py: 1 }}>
                <Typography color={textPrimary}>• Your subscription expenses rose this month.</Typography>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

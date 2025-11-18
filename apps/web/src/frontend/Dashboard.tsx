import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./config/supabase";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

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
          `${apiUrl}/api/plaid/accounts?user_id=${encodeURIComponent(userId)}`
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

  // Pie chart data
  const pieData = accounts.map((a, idx) => ({
    id: idx,
    value: a.current_balance || 0,
    label: a.name || "Account",
  }));

  // Cash flow sample
  const cashFlow = [
    { month: "Jan", income: 3000, expenses: 2200 },
    { month: "Feb", income: 3200, expenses: 2500 },
    { month: "Mar", income: 2800, expenses: 2600 },
  ];

  return (
    <>
      <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Dashboard
          </Typography>
          <Button 
            variant="outlined" 
            onClick={handleSignOut} 
            disabled={signingOut}
            sx={{ textTransform: "none" }}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>
        </Box>

        {/* Main Grid */}
        <Grid container spacing={3}>
          {/* Account Distribution Pie */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: 400, 
                display: "flex", 
                flexDirection: "column",
                border: "1px solid #e0e0e0"
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Account Distribution
              </Typography>
              <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {loading ? (
                  <CircularProgress />
                ) : accounts.length === 0 ? (
                  <Typography color="text.secondary">No accounts linked.</Typography>
                ) : (
                  <PieChart
                    series={[
                      {
                        data: pieData,
                        highlightScope: { fade: 'global', highlight: 'item' },
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
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: 400, 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e0e0e0"
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={3}>
                Budget Health
              </Typography>
              <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                <CircularProgress
                  size={160}
                  thickness={4}
                  value={75}
                  variant="determinate"
                  sx={{ color: "#4caf50" }}
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
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    75%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" color="text.secondary">
                Healthy
              </Typography>
            </Paper>
          </Grid>

          {/* Cash Flow Summary */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: 400, 
                display: "flex", 
                flexDirection: "column",
                border: "1px solid #e0e0e0"
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Cash Flow Summary
              </Typography>
              <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart
                  xAxis={[{ scaleType: "band", data: cashFlow.map((d) => d.month) }]}
                  series={[
                    { 
                      data: cashFlow.map((d) => d.income), 
                      label: "Income",
                      color: "#4caf50"
                    },
                    { 
                      data: cashFlow.map((d) => d.expenses), 
                      label: "Expenses",
                      color: "#f44336"
                    },
                  ]}
                  width={450}
                  height={300}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Budget Goals */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: 400, 
                display: "flex", 
                flexDirection: "column",
                border: "1px solid #e0e0e0"
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Budget Goals
              </Typography>
              <List sx={{ flexGrow: 1 }}>
                <ListItem sx={{ px: 0, py: 2 }}>
                  <ListItemText
                    primary="Emergency Fund"
                    slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                  />
                  <Box sx={{ width: "45%", ml: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">60%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={60} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                </ListItem>
                <ListItem sx={{ px: 0, py: 2 }}>
                  <ListItemText
                    primary="Monthly Savings"
                    slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                  />
                  <Box sx={{ width: "45%", ml: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">40%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={40} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                </ListItem>
                <ListItem sx={{ px: 0, py: 2 }}>
                  <ListItemText
                    primary="Debt Payoff"
                    slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                  />
                  <Box sx={{ width: "45%", ml: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">20%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={20} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Recommendations / Alerts */}
          <Grid size={{ xs: 12 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3,
                border: "1px solid #e0e0e0"
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Recommendations & Alerts
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Typography>• You are overspending in Dining by 14%.</Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Typography>• Consider increasing your savings rate by 5%.</Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Typography>• Your subscription expenses rose this month.</Typography>
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
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

// MUI X Charts
import Grid from "@mui/material/GridLegacy";
import { PieChart, BarChart } from "@mui/x-charts";

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
  const pieData = accounts.map((a) => ({
    id: a.name || "Account",
    value: a.current_balance || 0,
  }));

  // Cash flow sample
  const cashFlow = [
    { month: "Jan", income: 3000, expenses: 2200 },
    { month: "Feb", income: 3200, expenses: 2500 },
    { month: "Mar", income: 2800, expenses: 2600 },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "1rem auto", padding: "1rem" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>

        <Button variant="outlined" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out..." : "Sign out"}
        </Button>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Account Distribution Pie */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Account Distribution
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : accounts.length === 0 ? (
              <Typography>No accounts linked.</Typography>
            ) : (
              <PieChart
                series={[
                  {
                    type: "pie",
                    data: pieData.map((d) => ({ id: d.id, value: d.value })),
                  },
                ]}
              />
            )}
          </Paper>
        </Grid>

        {/* Budget Health */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400, textAlign: "center" }}>
            <Typography variant="h6" mb={2}>
              Budget Health
            </Typography>
            <CircularProgress
              size={160}
              thickness={4}
              value={75}
              variant="determinate"
            />
            <Typography sx={{ mt: 2 }} variant="h5">
              75% Healthy
            </Typography>
          </Paper>
        </Grid>

        {/* Cash Flow Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Cash Flow Summary
            </Typography>
            <BarChart
              series={[
                { 
                  type: "bar", 
                  data: cashFlow.map((d) => d.income), 
                  label: "Income" 
                },
                { 
                  type: "bar", 
                  data: cashFlow.map((d) => d.expenses), 
                  label: "Expenses" 
                },
              ]}
            
            >
              
            </BarChart>
          </Paper>
        </Grid>

        {/* Budget Goals */}
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Budget Goals
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Emergency Fund" />
                <Box sx={{ width: "40%" }}>
                  <LinearProgress variant="determinate" value={60} />
                </Box>
              </ListItem>
              <ListItem>
                <ListItemText primary="Monthly Savings" />
                <Box sx={{ width: "40%" }}>
                  <LinearProgress variant="determinate" value={40} />
                </Box>
              </ListItem>
              <ListItem>
                <ListItemText primary="Debt Payoff" />
                <Box sx={{ width: "40%" }}>
                  <LinearProgress variant="determinate" value={20} />
                </Box>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recommendations / Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Recommendations & Alerts
            </Typography>
            <Typography>- You are overspending in Dining by 14%.</Typography>
            <Typography>- Consider increasing your savings rate by 5%.</Typography>
            <Typography>- Your subscription expenses rose this month.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

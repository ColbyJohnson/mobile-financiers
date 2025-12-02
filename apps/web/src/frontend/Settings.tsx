import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";

import { supabase } from "./config/supabase";
import { useSettings } from "./SettingsGlobal";
import Slider from "@mui/material/Slider";

export default function SettingsPage() {
  const {
    darkMode,
    highContrast,
    reducedMotion,
    fontSize,
    userEmail,
    userName,
    setSettings,
    saveSettings,
  } = useSettings();

  const [localDarkMode, setLocalDarkMode] = useState(darkMode);
  const [localHighContrast, setLocalHighContrast] = useState(highContrast);
  const [localReducedMotion, setLocalReducedMotion] = useState(reducedMotion);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [email, setEmail] = useState(userEmail || "");
  const [name, setName] = useState(userName || "");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Load authenticated email
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setEmail(data.user.email);
    }
    loadUser();
  }, []);

  const handleSave = async () => {
    setSettings({
      darkMode: localDarkMode,
      highContrast: localHighContrast,
      reducedMotion: localReducedMotion,
      fontSize: localFontSize,
      userEmail: email,
      userName: name,
    });
    await saveSettings();
    alert("Settings saved!");
  };

  const handleDeleteAccount = async () => {
    setOpenDeleteDialog(false);
    const { error } = await supabase.rpc("delete_user_account");
    if (!error) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const handleResetPassword = async () => {
    setOpenResetDialog(false);
    setResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) console.error("Password reset failed:", error);
    else alert("Password reset email sent!");
    setResettingPassword(false);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      {/* ===== ACCOUNT ===== */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Account</Typography>

        <TextField
          sx={{ mt: 2, maxWidth: 400 }}
          label="Email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          sx={{ mt: 2, maxWidth: 400 }}
          label="Name"
          fullWidth
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Box sx={{ mt: 2 }}>
            <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => setOpenResetDialog(true)}
          disabled={resettingPassword}
        >
          {resettingPassword ? "Sending reset email..." : "Reset Password"}
        </Button>
        </Box>
        
      </Paper>

      {/* ===== ACCESSIBILITY ===== */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Accessibility</Typography>

        <FormControlLabel
          control={
            <Switch
              checked={localDarkMode}
              onChange={(e) => setLocalDarkMode(e.target.checked)}
            />
          }
          label="Dark Mode"
        />

        <FormControlLabel
          control={
            <Switch
              checked={localHighContrast}
              onChange={(e) => setLocalHighContrast(e.target.checked)}
            />
          }
          label="High Contrast Mode"
        />

        <FormControlLabel
          control={
            <Switch
              checked={localReducedMotion}
              onChange={(e) => setLocalReducedMotion(e.target.checked)}
            />
          }
          label="Reduced Motion"
        />

        {/* FONT SIZE SLIDER */}
        <Box sx={{ mt: 3, maxWidth: 400 }}>
          <Typography gutterBottom>Font Size</Typography>
          <Slider
            min={12}
            max={28}
            step={1}
            value={localFontSize}
            onChange={(_, value) => setLocalFontSize(value as number)}
          />
          <Box
            sx={{
              mt: 2,
              p: 2,
              border: "1px solid #ccc",
              borderRadius: 2,
              fontSize: `${localFontSize}px`,
            }}
          >
            This is a preview of your selected font size.
          </Box>
        </Box>
      </Paper>

      <Button variant="contained" onClick={handleSave} sx={{ mb: 5 }}>
        Save Changes
      </Button>

      {/* ===== DANGER ZONE ===== */}
      <Paper sx={{ p: 3, border: "1px solid red", backgroundColor: "#ffebee" }}>
        <Typography variant="h6" color="error">
          Danger Zone
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Deleting your account is permanent and cannot be undone.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          sx={{ mt: 2 }}
          onClick={() => setOpenDeleteDialog(true)}
        >
          Delete My Account
        </Button>
      </Paper>

      {/* ===== DELETE DIALOG ===== */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Your Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is permanent. All of your data will be erased immediately.
            Are you absolutely sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleDeleteAccount}>
            Yes, Delete My Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== RESET PASSWORD DIALOG ===== */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Reset Password?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A password reset email will be sent to <strong>{email}</strong>.
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetPassword}>
            Yes, Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

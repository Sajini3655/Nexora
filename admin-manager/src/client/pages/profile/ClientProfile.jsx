import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Avatar,
  Stack,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";

import {
  fetchClientProfile,
  updateClientProfile,
  uploadProfilePicture,
} from "../../services/clientService";

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    timezone: "",
    profilePicture: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchClientProfile();

      setProfile(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        company: data.company || "",
        phone: data.phone || "",
        timezone: data.timezone || "",
        profilePicture: data.profilePicture || "",
      });
    } catch (err) {
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let payload = { ...formData };

      if (selectedFile) {
        const updatedProfilePicture = await uploadProfilePicture(selectedFile);
        payload = {
          ...payload,
          profilePicture: updatedProfilePicture,
        };

        setSelectedFile(null);
        setPreviewUrl("");
      }

      const updatedProfile = await updateClientProfile(payload);

      setProfile(updatedProfile);
      setFormData({
        name: updatedProfile.name || "",
        email: updatedProfile.email || "",
        company: updatedProfile.company || "",
        phone: updatedProfile.phone || "",
        timezone: updatedProfile.timezone || "",
        profilePicture: updatedProfile.profilePicture || "",
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl("");

    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      company: profile?.company || "",
      phone: profile?.phone || "",
      timezone: profile?.timezone || "",
      profilePicture: profile?.profilePicture || "",
    });

    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "rgba(124,92,255,0.8)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            mb: 1,
            letterSpacing: -0.5,
          }}
        >
          My Profile
        </Typography>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
          Manage your account information and profile settings
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      ) : null}

      {/* Profile Picture Section */}
      <Card
        sx={{
          mb: 3,
          background: "rgba(15,20,40,0.6)",
          border: "1px solid rgba(124,92,255,0.15)",
          backdropFilter: "blur(10px)",
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: 15,
            }}
          >
            Profile Picture
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={4}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Avatar
              src={previewUrl || profile?.profilePicture || ""}
              sx={{
                width: 120,
                height: 120,
                border: "3px solid rgba(124,92,255,0.3)",
                boxShadow: "0 8px 24px rgba(124,92,255,0.15)",
                background:
                  "linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,255,170,0.1))",
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              {(formData.name || "C").charAt(0).toUpperCase()}
            </Avatar>

            {isEditing ? (
              <Stack spacing={2} flex={1}>
                <input
                  type="file"
                  id="profile-picture-input"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                <Button
                  variant="outlined"
                  component="label"
                  htmlFor="profile-picture-input"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    width: "fit-content",
                    borderColor: "rgba(124,92,255,0.3)",
                    color: "rgba(124,92,255,0.9)",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "rgba(124,92,255,0.6)",
                      backgroundColor: "rgba(124,92,255,0.08)",
                    },
                  }}
                >
                  Upload New Picture
                </Button>

                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      {/* Profile Information Section */}
      <Card
        sx={{
          background: "rgba(15,20,40,0.6)",
          border: "1px solid rgba(124,92,255,0.15)",
          backdropFilter: "blur(10px)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: 15,
            }}
          >
            Personal Information
          </Typography>

          {isEditing ? (
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <ProfileTextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ProfileTextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ProfileTextField
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ProfileTextField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ProfileTextField
                  label="Timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(124,92,255,0.9), rgba(124,92,255,0.7))",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,1), rgba(124,92,255,0.85))",
                      },
                      "&:disabled": {
                        background: "rgba(124,92,255,0.4)",
                      },
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{
                      borderColor: "rgba(255,255,255,0.2)",
                      color: "#e7e9ee",
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <InfoItem label="Full Name" value={formData.name || "-"} />
                <InfoItem label="Email Address" value={formData.email || "-"} />
                <InfoItem
                  label="Company"
                  value={formData.company || "Not specified"}
                />
                <InfoItem
                  label="Phone Number"
                  value={formData.phone || "Not specified"}
                />
                <InfoItem
                  label="Timezone"
                  value={formData.timezone || "Not specified"}
                />

                <Grid item xs={12}>
                  <Divider
                    sx={{
                      borderColor: "rgba(255,255,255,0.08)",
                      my: 1,
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={() => setIsEditing(true)}
                    sx={{
                      mt: 2,
                      background:
                        "linear-gradient(135deg, rgba(124,92,255,0.9), rgba(124,92,255,0.7))",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,1), rgba(124,92,255,0.85))",
                      },
                    }}
                  >
                    Edit Profile
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function ProfileTextField({ label, name, value, onChange, type = "text" }) {
  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      sx={{
        "& .MuiOutlinedInput-root": {
          color: "#e7e9ee",
          "& fieldset": {
            borderColor: "rgba(255,255,255,0.15)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(255,255,255,0.3)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(124,92,255,0.5)",
          },
        },
        "& .MuiInputBase-input::placeholder": {
          color: "rgba(255,255,255,0.4)",
          opacity: 1,
        },
        "& .MuiInputLabel-root": {
          color: "rgba(255,255,255,0.7)",
        },
      }}
    />
  );
}

function InfoItem({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.6)",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Grid>
  );
}
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  IconButton,
  Paper,
  Alert,
  LinearProgress,
  Modal,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  useMediaQuery,
  Snackbar,
  Slide,
  Stack,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  CloudUpload,
  PictureAsPdf,
  Visibility,
  InfoOutlined,
  Close,
  Search,
  Share,
  ContentCopy,
  Sort,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

const API = process.env.REACT_APP_API_URL || "";

interface PDF {
  id: string;
  name: string;
  link: string;
  uploadDate?: string;
  size?: string;
  time?: number;
  date?: string;
}

export default function App() {
  const [search, setSearch] = useState("");
  const [publicPDFs, setPublicPDFs] = useState<PDF[]>([]);
  const [filteredPDFs, setFilteredPDFs] = useState<PDF[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [uploadLimitExceeded, setUploadLimitExceeded] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetch(`${API}/public`)
      .then((res) => res.json())
      .then((docs) => setPublicPDFs(docs))
      .catch(() => setPublicPDFs([]));
  }, []);

  useEffect(() => {
    const filtered = publicPDFs.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Sort the filtered PDFs
    filtered.sort((a, b) => {
      const timeA =
        a.time ||
        (a.date
          ? new Date(a.date).getTime()
          : a.uploadDate
          ? new Date(a.uploadDate).getTime()
          : 0);
      const timeB =
        b.time ||
        (b.date
          ? new Date(b.date).getTime()
          : b.uploadDate
          ? new Date(b.uploadDate).getTime()
          : 0);

      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    setFilteredPDFs(filtered);
  }, [search, publicPDFs, sortOrder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return setUploadError("Select a PDF.");
    if (file.size > 50 * 1024 * 1024) return setUploadError("Max 50 MB.");
    setUploadError("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return setUploadError("Select a file first.");
    setIsUploading(true);
    setUploadError("");
    setShareLink("");
    setUploadLimitExceeded(false);

    const formData = new FormData();
    formData.append("pdf", selectedFile);
    formData.append("visibility", visibility);

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        setUploadLimitExceeded(true);
        setShowSnackbar(true);
        setIsUploading(false);
        return;
      }

      if (!res.ok) {
        setUploadError(await res.text());
        setIsUploading(false);
        return;
      }

      const data = await res.json();
      setShareLink(data.url);
      setShowUpload(false);
      setSelectedFile(null);
      setUploadLimitExceeded(false);
      setShowSnackbar(false);

      if (visibility === "public") {
        fetch(`${API}/public`)
          .then((res) => res.json())
          .then((docs) => setPublicPDFs(docs));
      }
    } catch {
      setUploadError("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
  };

  function toAbsoluteLink(link: string): string {
    if (link.startsWith("http")) return link;
    const base =
      API && API !== "/" && API !== "http://localhost:3000"
        ? API
        : window.location.origin;
    return `${base.replace(/\/$/, "")}${link}`;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Glassmorphism AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
          color: "#fff",
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              px: 1.5,
              py: 0.5,
              mr: 2,
            }}
          >
            <PictureAsPdf sx={{ fontSize: 24, color: "#fff" }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: "#fff",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            PDF24
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            sx={{
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "16px",
              fontWeight: 600,
              textTransform: "none",
              fontSize: { xs: 14, sm: 16 },
              px: { xs: 2, sm: 3 },
              py: 1,
              color: "#fff",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.3)",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
              },
            }}
            onClick={() => setShowUpload(true)}
          >
            Upload
          </Button>
        </Toolbar>
      </AppBar>

      {/* Upload limit notification */}
      <Slide
        in={uploadLimitExceeded}
        direction="down"
        mountOnEnter
        unmountOnExit
      >
        <Box
          sx={{
            width: "100%",
            background: "rgba(255, 107, 107, 0.15)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 107, 107, 0.3)",
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <InfoOutlined sx={{ color: "#ff6b6b", fontSize: 20 }} />
          <Typography sx={{ color: "#fff", fontWeight: 500, fontSize: 15 }}>
            Upload limit exceeded (2 files/day)
          </Typography>
        </Box>
      </Slide>

      {/* Search Section */}
      <Container
        maxWidth="sm"
        sx={{ pt: { xs: 3, sm: 5 }, pb: 2, position: "relative", zIndex: 1 }}
      >
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            px: 3,
            py: 2,
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            mb: 3,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              background: "rgba(255, 255, 255, 0.3)",
              transform: "translateY(-2px)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
            },
          }}
          elevation={0}
        >
          <Search
            sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 24, mr: 2 }}
          />
          <TextField
            fullWidth
            placeholder="Search public PDFs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: 16,
                color: "#fff",
                "& input::placeholder": {
                  color: "rgba(255, 255, 255, 0.7)",
                  opacity: 1,
                },
              },
            }}
          />
        </Paper>
      </Container>

      {/* Upload Modal */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: "24px",
            p: 4,
            minWidth: 320,
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            position: "relative",
            outline: "none",
          }}
        >
          <IconButton
            onClick={() => setShowUpload(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "rgba(255, 255, 255, 0.8)",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            <Close />
          </IconButton>

          <Typography
            variant="h6"
            fontWeight={600}
            mb={3}
            color="#fff"
            sx={{ fontSize: "1.3rem" }}
          >
            Upload PDF
          </Typography>

          <Box mb={3}>
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileSelect}
            />
            <label htmlFor="pdf-input">
              <Button
                variant="outlined"
                fullWidth
                component="span"
                startIcon={<CloudUpload />}
                sx={{
                  py: 2,
                  fontWeight: 600,
                  borderRadius: "16px",
                  border: "2px dashed rgba(255, 255, 255, 0.4)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  fontSize: 16,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.6)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Choose PDF
              </Button>
            </label>

            {selectedFile && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Typography fontSize={15} color="#fff" fontWeight={500}>
                  {selectedFile.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  {selectedFile.size
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : ""}
                </Typography>
              </Box>
            )}

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
              }}
            >
              Max file size 50 MB
            </Typography>
          </Box>

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <RadioGroup
              row
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "public" | "private")
              }
              sx={{ justifyContent: "center" }}
            >
              <FormControlLabel
                value="public"
                control={
                  <Radio
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-checked": { color: "#fff" },
                    }}
                  />
                }
                label={<Typography sx={{ color: "#fff" }}>Public</Typography>}
              />
              <FormControlLabel
                value="private"
                control={
                  <Radio
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-checked": { color: "#fff" },
                    }}
                  />
                }
                label={<Typography sx={{ color: "#fff" }}>Private</Typography>}
              />
            </RadioGroup>
          </FormControl>

          {uploadError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                background: "rgba(255, 107, 107, 0.2)",
                color: "#fff",
                border: "1px solid rgba(255, 107, 107, 0.3)",
                borderRadius: "12px",
              }}
            >
              {uploadError}
            </Alert>
          )}

          {isUploading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                sx={{
                  height: 8,
                  borderRadius: 4,
                  background: "rgba(255, 255, 255, 0.2)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #667eea, #764ba2)",
                  },
                }}
              />
              <Typography
                variant="body2"
                align="center"
                sx={{ mt: 1, color: "rgba(255, 255, 255, 0.8)" }}
              >
                Uploading…
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            disabled={!selectedFile || isUploading}
            onClick={handleUpload}
            sx={{
              py: 2,
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: "16px",
              fontSize: 16,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.3)",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
              },
              "&:disabled": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.5)",
              },
            }}
          >
            {isUploading ? "Uploading…" : "Upload PDF"}
          </Button>
        </Box>
      </Modal>

      {/* PDF Cards */}
      <Container maxWidth="lg" sx={{ pb: 6, position: "relative", zIndex: 1 }}>
        {/* Header with title, count, and sort */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#fff",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                mb: 0.5,
              }}
            >
              Public PDFs
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: 14,
              }}
            >
              {publicPDFs.length} total PDFs
            </Typography>
          </Box>

          <FormControl
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": {
                background: "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "12px",
                color: "#fff",
                "& fieldset": {
                  border: "none",
                },
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.3)",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.8)",
                "&.Mui-focused": {
                  color: "#fff",
                },
              },
              "& .MuiSelect-icon": {
                color: "rgba(255, 255, 255, 0.8)",
              },
            }}
          >
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortOrder}
              label="Sort by"
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              startAdornment={
                <Sort sx={{ mr: 1, color: "rgba(255, 255, 255, 0.8)" }} />
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "12px",
                    mt: 1,
                  },
                },
              }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fill, minmax(300px, 1fr))",
            },
            gap: 3,
            justifyItems: "center",
          }}
        >
          {filteredPDFs.length ? (
            filteredPDFs.map((pdf) => (
              <Paper
                key={pdf.id}
                sx={{
                  width: "100%",
                  maxWidth: 320,
                  minHeight: 200,
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255, 255, 255, 0.25)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "24px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  p: 3,
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-8px) scale(1.02)",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
                    background: "rgba(255, 255, 255, 0.3)",
                  },
                }}
                elevation={0}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
                  <Box
                    sx={{
                      minWidth: 48,
                      minHeight: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      mr: 2,
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    <PictureAsPdf
                      sx={{
                        fontSize: 32,
                        color: "#fff",
                        opacity: 0.9,
                      }}
                    />
                    {pdf.size && (
                      <Chip
                        size="small"
                        label={pdf.size}
                        sx={{
                          position: "absolute",
                          bottom: -8,
                          right: -8,
                          background: "rgba(255, 255, 255, 0.9)",
                          color: "#667eea",
                          fontWeight: 600,
                          fontSize: 10,
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#fff",
                        fontSize: 16,
                        lineHeight: 1.3,
                        mb: 0.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {pdf.name.replace(".pdf", "")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: 12,
                        lineHeight: 1.4,
                      }}
                    >
                      {pdf.time
                        ? new Date(pdf.time).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : pdf.date
                        ? new Date(pdf.date).toLocaleDateString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })
                        : pdf.uploadDate
                        ? new Date(pdf.uploadDate).toLocaleDateString()
                        : ""}
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: "auto" }}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() =>
                      window.open(toAbsoluteLink(pdf.link), "_blank")
                    }
                    sx={{
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: 14,
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      color: "#fff",
                      borderRadius: "12px",
                      py: 1,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        background: "rgba(255, 255, 255, 0.2)",
                        borderColor: "rgba(255, 255, 255, 0.6)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    View
                  </Button>
                </Stack>
              </Paper>
            ))
          ) : (
            <Box
              sx={{
                py: 8,
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.8)",
                width: "100%",
                gridColumn: "1 / -1",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                No public PDFs found
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                Upload your first PDF to get started
              </Typography>
            </Box>
          )}
        </Box>
      </Container>

      {/* Share Link Success Alert */}
      <Snackbar
        open={!!shareLink}
        autoHideDuration={6000}
        onClose={() => setShareLink("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShareLink("")}
          severity="success"
          sx={{
            background: "rgba(76, 175, 80, 0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(76, 175, 80, 0.3)",
            color: "#fff",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
          }}
          icon={<Share />}
        >
          <Typography
            component="span"
            sx={{
              wordBreak: "break-all",
              fontWeight: 600,
              color: "#fff",
              mr: 1,
              flex: 1,
            }}
          >
            {shareLink}
          </Typography>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={{
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              ml: 1,
              "&:hover": {
                background: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Alert>
      </Snackbar>

      {/* Upload limit snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity="warning"
          sx={{
            background: "rgba(255, 152, 0, 0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 152, 0, 0.3)",
            color: "#fff",
            borderRadius: "12px",
          }}
        >
          Upload limit exceeded (2 files/day)
        </Alert>
      </Snackbar>
    </Box>
  );
}

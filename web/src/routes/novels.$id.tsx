import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Breadcrumbs,
  Pagination,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  useTheme,
  useMediaQuery,
  Menu,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Download, Settings, MoreVert } from '@mui/icons-material';
import { api } from '../api';
import type { NovelPost, NovelThread } from '../api';
import { useStore } from '../store/useStore';

type ReaderSearch = {
  page?: number;
};

export const Route = createFileRoute('/novels/$id')({
  component: Reader,
  validateSearch: (search: Record<string, unknown>): ReaderSearch => {
    return {
      page: Number(search.page) || undefined,
    };
  },
});

function Reader() {
  const { id } = Route.useParams();
  const search = useSearch({ from: '/novels/$id' });
  const navigate = useNavigate({ from: '/novels/$id' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { prefs, setPrefs } = useStore();

  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<NovelThread | null>(null);
  const [posts, setPosts] = useState<NovelPost[]>([]);
  const [page, setPage] = useState(search.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<number | null>(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const progressKey = `novel-progress-${id}`;

  const fetchData = async (pageNum: number, isInitial = false) => {
    setLoading(true);
    try {
      const [threadRes, postsRes] = await Promise.all([
        api.getNovelDetails(Number(id)),
        api.getNovelPosts(Number(id), { page: pageNum, pageSize: 20, order: 'asc' })
      ]);
      setThread(threadRes);
      setPosts(postsRes.data);
      setTotalPages(postsRes.pagination.totalPages);

      if (isInitial && pendingScroll !== null) {
        // Wait for render
        setTimeout(() => {
          window.scrollTo({ top: pendingScroll, behavior: 'auto' });
          setPendingScroll(null);
        }, 100);
      } else if (!isInitial) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with progress recovery
  useEffect(() => {
    try {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { page?: number; scroll?: number };
        if (parsed.page && parsed.page > 0) {
          setPage(parsed.page);
          if (typeof parsed.scroll === 'number') {
            setPendingScroll(parsed.scroll);
          }
          fetchData(parsed.page, true);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    }
    fetchData(page, true);
  }, [id]);

  // Page change sync
  useEffect(() => {
    if (page !== (search.page || 1)) {
      navigate({ search: { page }, replace: true });
      fetchData(page);
    }
  }, [page]);

  // Save progress on scroll
  useEffect(() => {
    if (!posts.length || loading) return;

    const saveProgress = () => {
      try {
        localStorage.setItem(progressKey, JSON.stringify({
          page,
          scroll: window.scrollY
        }));
      } catch (e) {
        console.error('Failed to save progress', e);
      }
    };

    let timeoutId: number;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(saveProgress, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [page, posts.length, loading, progressKey]);

  const handleDownload = () => {
    window.open(`/api/novels/${id}/txt`, '_blank');
  };

  if (loading && !posts.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box ref={scrollRef}>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            首页
          </Link>
          <Typography color="text.primary" sx={{ maxWidth: '200px' }} noWrap>
            {thread?.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
        {thread?.title}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {posts.map((post) => (
          <Paper
            key={post.id}
            elevation={0}
            sx={{
              p: { xs: 2, sm: 4 },
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'divider' : '#eee',
              transition: 'all 0.2s'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                #{post.floor} 楼
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : ''}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: prefs.lineHeight,
                fontSize: `${prefs.fontSize}px`,
                fontWeight: prefs.fontWeight,
                fontFamily: prefs.fontFamily,
                color: theme.palette.text.primary,
                transition: 'all 0.2s'
              }}
            >
              {post.content}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ mt: 4, pb: 8, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          size={isMobile ? 'small' : 'medium'}
        />
      </Box>

      <Fab
        color="primary"
        aria-label="menu"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleMenuOpen}
      >
        <MoreVert />
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem onClick={() => { setShowSettings(true); handleMenuClose(); }}>
          <Settings sx={{ mr: 1, fontSize: 20 }} />
          阅读设置
        </MenuItem>
        <MenuItem onClick={() => { handleDownload(); handleMenuClose(); }}>
          <Download sx={{ mr: 1, fontSize: 20 }} />
          下载 TXT
        </MenuItem>
      </Menu>

      <Dialog open={showSettings} onClose={() => setShowSettings(false)} fullWidth maxWidth="xs">
        <DialogTitle>阅读设置</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small">
                <InputLabel>字体</InputLabel>
                <Select
                  label="字体"
                  value={prefs.fontFamily}
                  onChange={(e) => setPrefs({ fontFamily: e.target.value })}
                >
                  <MenuItem value="Inter, system-ui, sans-serif">默认 (Inter)</MenuItem>
                  <MenuItem value="Georgia, serif">Georgia (衬线)</MenuItem>
                  <MenuItem value="'SF Pro Text', system-ui, sans-serif">SF Pro</MenuItem>
                  <MenuItem value="'Noto Serif SC', serif">思源宋体</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>粗细</InputLabel>
                <Select
                  label="粗细"
                  value={prefs.fontWeight}
                  onChange={(e) => setPrefs({ fontWeight: Number(e.target.value) })}
                >
                  {[300, 400, 500, 600, 700].map(w => (
                    <MenuItem key={w} value={w}>{w}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">字号: {prefs.fontSize}px</Typography>
              <Slider
                size="small"
                min={12}
                max={32}
                value={prefs.fontSize}
                onChange={(_, v) => setPrefs({ fontSize: v as number })}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">行高: {prefs.lineHeight}</Typography>
              <Slider
                size="small"
                min={1.2}
                max={3.0}
                step={0.1}
                value={prefs.lineHeight}
                onChange={(_, v) => setPrefs({ lineHeight: v as number })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                size="small"
                label="文字颜色"
                type="color"
                value={prefs.textColor}
                onChange={(e) => setPrefs({ textColor: e.target.value, mode: 'light' })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="背景颜色"
                type="color"
                value={prefs.bgColor}
                onChange={(e) => setPrefs({ bgColor: e.target.value, mode: 'light' })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

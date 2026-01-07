import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Pagination,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Update, Add } from '@mui/icons-material';
import { api } from '../api';
import type { NovelThread } from '../api';
import { useStore } from '../store/useStore';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { searchKeyword, setSearchKeyword, subscribedOnly } = useStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NovelThread[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Add Novel state
  const [openAdd, setOpenAdd] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.getNovels({
        page,
        keyword: searchKeyword,
        subscribed: subscribedOnly || undefined,
        sort: 'latestPostAt',
      });
      setData(res.data);
      setTotal(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, subscribedOnly, searchKeyword]);

  const handleAddNovel = async () => {
    if (!addUrl) return;
    setAdding(true);
    try {
      await api.fetchNovel({ url: addUrl });
      setOpenAdd(false);
      setAddUrl('');
      fetchList();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="搜索标题/作者"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        {/* 暂时隐藏订阅相关功能
        <FormControlLabel
          control={<Switch checked={subscribedOnly} onChange={(e) => setSubscribedOnly(e.target.checked)} />}
          label="仅看订阅"
        />
        */}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAdd(true)}
          disableElevation
        >
          添加
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 2
            }}
          >
            {data.map((thread) => (
              <Card
                key={thread.id}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => navigate({ to: '/novels/$id', params: { id: thread.id.toString() } })}
              >
                <CardContent sx={{ position: 'relative' }}>
                  {/* 暂时隐藏订阅功能
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleToggleSubscribe(e, thread)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    {thread.subscribed ? <Star color="primary" /> : <StarBorder />}
                  </IconButton>
                  */}
                  <Typography variant="subtitle1" component="div" sx={{ pr: 2, fontWeight: 'bold', mb: 1 }} noWrap title={thread.title}>
                    {thread.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    作者: {thread.author?.name || '未知'}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      size="small"
                      label={`${thread.postCount} 章节`}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Update sx={{ fontSize: 14 }} />
                      {thread.latestPostAt ? new Date(thread.latestPostAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={total}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>添加小说</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="小说链接 (URL)"
            fullWidth
            variant="outlined"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            disabled={adding}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} disabled={adding}>取消</Button>
          <Button onClick={handleAddNovel} variant="contained" disabled={adding || !addUrl}>
            {adding ? '正在拉取...' : '确定'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


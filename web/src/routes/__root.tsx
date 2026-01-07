import { useEffect, useMemo } from 'react';
import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  IconButton, 
  Tooltip, 
  Slide, 
  useScrollTrigger 
} from '@mui/material';
import { DarkMode, LightMode, ArrowBack } from '@mui/icons-material';
import { useStore } from '../store/useStore';

const HideOnScroll = ({ children }: { children: React.ReactElement }) => {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
};

const RootComponent = () => {
  const { prefs, setPrefs, hydrated, initPrefs } = useStore();
  const routerState = useRouterState();
  const isRoot = routerState.location.pathname === '/';

  useEffect(() => {
    if (!hydrated) initPrefs();
  }, [hydrated, initPrefs]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefs.mode,
          primary: { main: '#1976d2' },
          background: { 
            default: prefs.mode === 'dark' ? '#0f172a' : prefs.bgColor,
            paper: prefs.mode === 'dark' ? '#1e293b' : '#ffffff',
          },
          text: { 
            primary: prefs.mode === 'dark' ? '#f1f5f9' : prefs.textColor,
          },
        },
        typography: {
          fontFamily: prefs.fontFamily,
        },
      }),
    [prefs],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        <HideOnScroll>
          <AppBar position="sticky" elevation={1}>
            <Toolbar variant="dense">
              {!isRoot && (
                <IconButton
                  color="inherit"
                  component={Link}
                  to="/"
                  sx={{ mr: 1 }}
                  size="small"
                >
                  <ArrowBack />
                </IconButton>
              )}
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{ 
                  flexGrow: 1, 
                  textDecoration: 'none', 
                  color: 'inherit',
                  fontWeight: 700
                }}
              >
                tt1069-sub
              </Typography>
              <Tooltip title={prefs.mode === 'light' ? '夜间模式' : '日间模式'}>
                <IconButton
                  color="inherit"
                  onClick={() => setPrefs({ mode: prefs.mode === 'light' ? 'dark' : 'light' })}
                  size="small"
                >
                  {prefs.mode === 'light' ? <DarkMode /> : <LightMode />}
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
        </HideOnScroll>
        <Container component="main" maxWidth="lg" sx={{ mt: 2, mb: 4, flexGrow: 1 }}>
          <Outlet />
        </Container>
      </Box>
      <TanStackRouterDevtools />
    </ThemeProvider>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});

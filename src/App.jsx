import { lazy, Suspense, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import {
    LeaderboardSkeleton,
    HistorySkeleton,
    PlayersSkeleton,
    PlayerProfileSkeleton,
    NewSessionSkeleton,
    SettingsSkeleton,
} from './components/SkeletonLoader';

const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Player = lazy(() => import('./pages/Player'));
const History = lazy(() => import('./pages/History'));
const Players = lazy(() => import('./pages/Players'));
const NewSession = lazy(() => import('./pages/NewSession'));
const Settings = lazy(() => import('./pages/Settings'));

const pageVariants = {
    initial: { opacity: 0, x: 18 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -18 },
};

const pageTransition = { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] };

function ScrollToTop() {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return null;
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <>
            <ScrollToTop />
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={location.pathname}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={pageTransition}
                    className="w-full"
                >
                    <Routes location={location}>
                        <Route
                            path="/"
                            element={
                                <Suspense fallback={<LeaderboardSkeleton />}>
                                    <Leaderboard />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/players"
                            element={
                                <Suspense fallback={<PlayersSkeleton />}>
                                    <Players />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/player/:name"
                            element={
                                <Suspense fallback={<PlayerProfileSkeleton />}>
                                    <Player />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/history"
                            element={
                                <Suspense fallback={<HistorySkeleton />}>
                                    <History />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/new-session"
                            element={
                                <Suspense fallback={<NewSessionSkeleton />}>
                                    <NewSession />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <Suspense fallback={<SettingsSkeleton />}>
                                    <Settings />
                                </Suspense>
                            }
                        />
                    </Routes>
                </motion.div>
            </AnimatePresence>
        </>
    );
}

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <Layout>
                <AnimatedRoutes />
            </Layout>
        </Router>
    );
}

export default App;

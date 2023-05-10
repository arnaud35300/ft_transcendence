import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorNotFound } from "components/Error/ErrorNotFound";
import { Lobby } from "components/Lobby/Lobby";
import { TwoFaAuthenticate } from "components/TwoFaAuthenticate/TwoFaAuthenticate";
import { Callback } from "containers/Callback/Callback";
import { HeaderWrapper } from "containers/HeaderWrapper/HeaderWrapper";
import { Home } from "containers/Home/Home";
import { Profile } from "containers/Profile/Profile";
import { ProtectedRoute } from "containers/ProtectedRoute/ProtectedRoute";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import {
	removeSocketChatListeners,
	socketChatListeners,
} from "sockets/listeners/chatListeners";
import {
	removeSocketUserListeners,
	socketUserListeners,
} from "sockets/listeners/userListeners";
import {
	connectChatSocket,
	disconnectChatSocket,
	initializeChatSocket,
} from "sockets/socket";
import { AuthStatus } from "types/auth/auth";
import { RootState } from "types/global/global";

const router = createBrowserRouter([
	{
		path: "/",
		element: <HeaderWrapper />,
		errorElement: <ErrorNotFound />,
		children: [
			{
				path: "/",
				element: <Home />,
			},
			{
				path: "/callback",
				element: <Callback />,
			},
			{
				path: "/auth/2fa",
				element: <TwoFaAuthenticate />,
			},
			{
				element: <ProtectedRoute />,
				children: [
					{
						path: "/user/:id",
						element: <Profile />,
					},
					{
						path: "/lobby",
						element: <Lobby />,
					},
				],
			},
			{
				path: "*",
				element: <ErrorNotFound />,
			},
		],
	},
]);

const App: React.FC = () => {
	const dispatch = useDispatch();
	const isAuth = useSelector((state: RootState) => state.AUTH.isAuth);
	const queryClient = useMemo(() => new QueryClient(), []);
	const connectedUserId = useSelector(
		(state: RootState) => state.USER.user?.id
	);
	const chatSocket = initializeChatSocket();

	useEffect(() => {
		if (!chatSocket || !connectedUserId) return;
		if (isAuth !== AuthStatus.Authenticated) {
			disconnectChatSocket();
			removeSocketChatListeners();
			removeSocketUserListeners();
		}
		if (isAuth === AuthStatus.Authenticated) {
			connectChatSocket();
			socketChatListeners(dispatch);
			socketUserListeners(queryClient, connectedUserId);
		}
		return () => {
			disconnectChatSocket();
			removeSocketChatListeners();
			removeSocketUserListeners();
		};
	}, [chatSocket, dispatch, isAuth, queryClient, connectedUserId]);

	return (
		<>
			<QueryClientProvider client={queryClient}>
				<ToastContainer theme="dark" />
				<RouterProvider router={router} />
				<ReactQueryDevtools initialIsOpen={true} />
			</QueryClientProvider>
		</>
	);
};

export { App };

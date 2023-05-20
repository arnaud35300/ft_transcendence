import { faMessage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Loader } from "components/Loader/Loader";
import { ChatWrapper } from "containers/ChatWrapper/ChatWrapper";
import { Header } from "containers/Header/Header";
import { ToastManager } from "containers/ToastManager/ToastManager";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import { authenticate } from "store/auth-slice/auth-slice";
import { setShowChat, setShowChatModal } from "store/chat-slice/chat-slice";
import { AuthStatus } from "types/auth/auth";
import { RootState } from "types/global/global";

const HeaderWrapper: React.FC = () => {
	// state
	const [loading, setLoading] = useState(true);

	// react-router
	const location = useLocation();

	// redux
	const dispatch = useDispatch();
	const isAuth = useSelector((store: RootState) => store.AUTH.isAuth);

	useEffect(() => {
		dispatch(authenticate());
		setLoading(false);
	}, [location, dispatch]);

	// Etat pour afficher le chat en mode modal
	const showModal = useSelector((store: RootState) => store.CHAT.showModal);
	const showChat = useSelector((store: RootState) => store.CHAT.showChat);
	const handleShowChatModal = (value: boolean) => {
		dispatch(setShowChatModal(value));
	};

	const handleShowChat = (value: boolean) => {
		dispatch(setShowChat(value));
	};

	useEffect(() => {
		console.log("RERENDER");
	});

	return (
		<div className="h-full flex flex-col items-stretch max-h-full bg-backgroundColor">
			<div className="flex-shrink-0">
				<Header />
			</div>
			<div className="flex justify-center h-full w-full">
				<div className="flex justify-between py-10  max-w-[2000px] mx-0 md:mx-10 items-stretch overflow-auto h-full border-2 border-red-500 w-full lg:relative">
					<div className="flex-grow">
						{loading ? <Loader /> : <Outlet />}
					</div>
					{isAuth === AuthStatus.Authenticated && (
						<ChatWrapper
							showModal={showModal}
							setShowModal={handleShowChatModal}
						/>
					)}
					{!showModal && (
						<button
							type="button"
							className="text-white hover:bg-astronaut-900  bg-mirage-900  font-medium text-sm text-center fixed bottom-4 right-4 xl:hidden rounded-full p-4 shadow-lg absolute"
							onClick={() => handleShowChatModal(true)}
						>
							<FontAwesomeIcon icon={faMessage} />
						</button>
					)}
					{!showChat && (
						<button
							type="button"
							className="text-white hover:bg-astronaut-900  bg-mirage-900 font-medium text-sm text-center fixed bottom-4 right-4 hidden xl:block rounded-full p-4 shadow-lg  absolute"
							onClick={() => handleShowChat(true)}
						>
							<FontAwesomeIcon icon={faMessage} />
						</button>
					)}
				</div>
			</div>
			<ToastManager />
		</div>
	);
};

export { HeaderWrapper };

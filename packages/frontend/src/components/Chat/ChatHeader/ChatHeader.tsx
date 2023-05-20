import { faBars, faEllipsis, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useSelector } from "react-redux";
import { selectActiveChannel } from "store/chat-slice/chat-slice";
import { ChannelType } from "types/chat/chat";

interface ChatHeaderProps {
	handleCloseChat: () => void;
	handleCloseChatModal: () => void;
	handleEditChannel: () => void;
	toggleMenu: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
	handleCloseChat,
	handleCloseChatModal,
	handleEditChannel,
	toggleMenu,
}) => {
	const activeChannel = useSelector(selectActiveChannel);

	return (
		<div className="flex items-center">
			<div>
				<button className="" onClick={toggleMenu}>
					<FontAwesomeIcon fixedWidth icon={faBars} size="xl" />
				</button>
			</div>
			<div className="flex-auto flex-grow flex justify-center items-center cursor-default">
				{activeChannel && (
					<div>
						<div className="text-center text-2xl hidden 2xl:block">
							{activeChannel.type === ChannelType.Direct_message
								? activeChannel?.user?.name.replace(
										/(.{15})..+/,
										"$1…"
								  )
								: activeChannel.name.replace(
										/(.{15})..+/,
										"$1…"
								  )}
						</div>
						<div className="text-center text-2xl 2xl:hidden">
							{activeChannel.type === ChannelType.Direct_message
								? activeChannel?.user?.name.replace(
										/(.{7})..+/,
										"$1…"
								  )
								: activeChannel.name.replace(
										/(.{7})..+/,
										"$1…"
								  )}
						</div>
					</div>
				)}
				{activeChannel &&
					(activeChannel.permissions.canModify ||
						activeChannel.permissions.canDelete) && (
						<div className="flex justify-center items-center">
							<button
								onClick={handleEditChannel}
								className="ml-3"
							>
								<FontAwesomeIcon icon={faEllipsis} size="lg" />
							</button>
						</div>
					)}
			</div>
			<div>
				<button onClick={handleCloseChatModal} className="lg:hidden">
					<FontAwesomeIcon fixedWidth icon={faXmark} size="xl" />
				</button>
				<button onClick={handleCloseChat} className="hidden lg:block">
					<FontAwesomeIcon fixedWidth icon={faXmark} size="xl" />
				</button>
			</div>
		</div>
	);
};

export { ChatHeader };

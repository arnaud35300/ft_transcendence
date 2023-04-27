import React, { useState } from "react";
import { Channel } from "../../../types/chat";
import { ChannelItem } from "../ChannelItem/ChannelItem";

interface ChannelListProps {
	title: string;
	channels: Channel[];
	activeChannel: Channel | null;
	handleClickChannel: (channel: Channel) => void;
	handleEditChannel: (channel: Channel) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
	title,
	channels,
	activeChannel,
	handleClickChannel,
	handleEditChannel,
}) => {
	const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);

	return (
		<div className="h-full flex flex-col">
			<div className="mb-4 cursor-default text-center underline text-white">
				<p>{title}</p>
			</div>
			<ul className="overflow-auto flex-grow">
				{channels.map((channel) => (
					<ChannelItem
						key={channel.id}
						channel={channel}
						handleClick={handleClickChannel}
						isActive={activeChannel?.id === channel.id}
						handleEditChannel={handleEditChannel}
						openedMenuId={openedMenuId}
						setOpenedMenuId={setOpenedMenuId}
					/>
				))}
			</ul>
		</div>
	);
};

export { ChannelList };

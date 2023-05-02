import { Profile2faAuth } from "components/Profile/ProfileCard/Profile2faAuth/Profile2faAuth";
import { ProfileAvatar } from "components/Profile/ProfileCard/ProfileAvatar/ProfileAvatar";
import { ProfileName } from "components/Profile/ProfileCard/ProfileName/ProfileName";
import { useSelector } from "react-redux";
import { RootState } from "types/global/global";
import { User } from "types/user/user";

interface ProfileCardProps {
	user: User;
	isConnectedUser: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, isConnectedUser }) => {
	const isTwoFactorAuthEnabled = useSelector(
		(store: RootState) => store.AUTH.isTwoFactorAuthEnabled
	);

	return (
		<div className="p-6 flex flex-col lg:w-1/2 shadow-lg rounded-xl">
			<ProfileAvatar
				isConnectedUser={isConnectedUser}
				id={user.id}
				profilePictureUrl={user.profilePictureUrl}
				status={user.status}
			/>
			<div className="h-1/2 flex flex-col  items-center pt-5">
				<div>
					<ProfileName
						isConnectedUser={isConnectedUser}
						id={user.id}
						name={user.name}
					/>
				</div>
				{isConnectedUser && (
					<Profile2faAuth
						id={user.id}
						isTwoFactorAuthEnabled={isTwoFactorAuthEnabled}
					/>
				)}
			</div>
		</div>
	);
};

export { ProfileCard };
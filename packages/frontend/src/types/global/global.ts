import { ChatState } from "types/chat/chat";
import { CustomNotificationState } from "types/customNotification/customNotification";
import { TooltipState } from "types/toolTip/toolTip";

import { SelfUserState } from "../user/reducer";
import { AuthState } from "../auth/reducer";

// redux store
export interface RootState {
	AUTH: AuthState;
	USER: SelfUserState;
	CHAT: ChatState;
	CUSTOM_NOTIFICATION: CustomNotificationState;
	TOOLTIP: TooltipState;
}

// api
export interface ApiErrorResponse {
	error: number;
	message: string[];
	statusCode: number;
}

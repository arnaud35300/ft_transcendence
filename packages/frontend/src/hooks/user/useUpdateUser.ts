import { useMutation, UseMutationResult } from "@tanstack/react-query";
// import { useDispatch } from "react-redux";
import { updateUserById } from "../../api/user/userRequests";
import { ApiErrorResponse } from "../../types/global";
import { UpdateUserRequest, User } from "../../types/user";

const useUpdateUser = (
	id: string
): UseMutationResult<User, ApiErrorResponse, UpdateUserRequest> => {
	// const dispatch = useDispatch();
	const mutation = useMutation<User, ApiErrorResponse, UpdateUserRequest>(
		(data: UpdateUserRequest) => updateUserById(id, data),
		{
			onSuccess: (user) => {
				console.log("USER", user, "updated");
				// dispatch(setUser(user)); TODO: wait for API to be fixed
			},
			onError: (error) => {
				console.error(error);
			},
		}
	);
	return mutation;
};

export { useUpdateUser };
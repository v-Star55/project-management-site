import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    imageUrl?: string;
    company?: {
        id: string;
        name: string;
        description: string;
        imageUrl: string;
    };
}

interface UserState {
    user: User | null;
    isLoggedIn: boolean;
}

const initialState: UserState = {
    user: null,
    isLoggedIn: false,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isLoggedIn = true;
        },
        clearUser: (state) => {
            state.user = null;
            state.isLoggedIn = false;
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
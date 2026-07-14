import axios from "axios";

const UserApi = {
    signup: async (data: any) => {
        const response = await axios.post('/api/user/signup', data);
        return response.data;
        
    },
    login: async (data: any) => {
        const response = await axios.post('/api/user/login', data);
        return response.data;
    }
}

export default UserApi;
import url from '../../url';
import AllCoursesResponse from '../../interfaces';


export default async function getAllClasses(): Promise<AllCoursesResponse> {
    try {
        const loggedIn: string | null = localStorage.getItem("isLoggedIn");
        if (loggedIn == null) {
            throw new Error("User is not logged in");
        }

        const response: Response = await fetch(url + '/courses', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Error getting response");
        }

        const data: AllCoursesResponse = await response.json();
        console.log("All Classes data: ",data);
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
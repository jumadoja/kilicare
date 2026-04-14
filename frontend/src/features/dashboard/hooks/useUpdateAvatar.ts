import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api"; // Hakikisha path ni sahihi
import { toast } from "react-hot-toast";

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 1. Function ya kupandisha picha
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file); // 'avatar' lazima ifanane na field ya Django

      const response = await apiClient.patch("/auth/me/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },

    // 2. Ikifanikiwa (Success)
    onSuccess: (data) => {
      // Huu ndio uchawi: Inalazimisha 'fetchMe' ivute data mpya
      queryClient.invalidateQueries({ queryKey: ["me"] });
      
      toast.success("Picha ya wasifu imesasishwa! ✨", {
        style: {
          borderRadius: '15px',
          background: '#1A3C34',
          color: '#fff',
          fontWeight: 'bold'
        },
      });
    },

    // 3. Ikitokea kosa (Error)
    onError: (error: any) => {
      const errorMessage = error.response?.data?.avatar?.[0] || "Imeshindikana kupakia picha";
      toast.error(errorMessage);
      console.error("Avatar Upload Error:", error);
    },
  });
};
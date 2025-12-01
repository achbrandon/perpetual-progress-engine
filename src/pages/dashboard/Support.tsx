import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedSupportChat } from "@/components/dashboard/EnhancedSupportChat";

export default function Support() {
  const [user, setUser] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setUser(user);
    setShowChat(true);
  };

  if (!showChat || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <EnhancedSupportChat userId={user.id} onClose={() => navigate("/bank/dashboard")} />
    </div>
  );
}

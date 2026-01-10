'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button, ButtonProps } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps extends ButtonProps {
    showLabel?: boolean;
}

export default function LogoutButton({ showLabel = false, className, variant = 'destructive', ...props }: LogoutButtonProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <Button
            onClick={handleLogout}
            variant={variant}
            className={className}
            {...props}
        >
            <LogOut className={`h-4 w-4 ${showLabel ? 'mr-2' : ''}`} />
            {showLabel && "Cerrar Sesión"}
        </Button>
    );
}

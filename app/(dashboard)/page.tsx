"use client";
import { Button } from "@/components/ui/button";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
// import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";

export default function Home() {
  const { onOpen } = useNewAccount();
  // const { data: accounts, isLoading } = useGetAccounts();

  return (
    <div>
      <Button onClick={onOpen}>Open New Account</Button>
    </div>
  );
}

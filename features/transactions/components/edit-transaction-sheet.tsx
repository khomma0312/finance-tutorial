"use client";

import { z } from "zod";
import { Loader2 } from "lucide-react";

import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useEditTransaction } from "@/features/transactions/api/use-edit-transaction";
import { useGetTransaction } from "@/features/transactions/api/use-get-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";
import { TransactionForm } from "@/features/transactions/components/transaction-form";

import { insertTransactionSchema } from "@/db/schema";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useConfirm } from "@/hooks/use-confirm";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";

const formSchema = insertTransactionSchema.omit({
  id: true,
});

type FormValues = z.input<typeof formSchema>;

export const EditTransactionSheet = () => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this transaction."
  );
  // Transaction query and mutation
  const { isOpen, onClose, id } = useOpenTransaction();
  const transactionQuery = useGetTransaction(id);
  const editMutation = useEditTransaction(id);
  const deleteMutation = useDeleteTransaction(id);

  // Category options and mutation
  const categoryQuery = useGetCategories();
  const categoryMutation = useCreateCategory();
  const onCreateCategory = (name: string) => categoryMutation.mutate({ name });
  const categoryOptions = (categoryQuery.data ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  // Account options and mutation
  const accountQuery = useGetAccounts();
  const accountMutation = useCreateAccount();
  const onCreateAccount = (name: string) => accountMutation.mutate({ name });
  const accountOptions = (accountQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const isPending =
    editMutation.isPending ||
    deleteMutation.isPending ||
    transactionQuery.isLoading ||
    accountMutation.isPending ||
    categoryMutation.isPending;

  const isLoading =
    transactionQuery.isLoading ||
    accountQuery.isLoading ||
    categoryQuery.isLoading;

  const onSubmit = (values: FormValues) => {
    editMutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const onDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const defaultValues = transactionQuery.data
    ? {
        date: transactionQuery.data.date
          ? new Date(transactionQuery.data.date)
          : new Date(),
        accountId: transactionQuery.data.accountId,
        payee: transactionQuery.data.payee,
        amount: transactionQuery.data.amount.toString(),
        categoryId: transactionQuery.data.categoryId,
        notes: transactionQuery.data.notes,
      }
    : {
        date: new Date(),
        accountId: "",
        payee: "",
        amount: "",
        categoryId: "",
        notes: "",
      };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
            <SheetDescription>Edit an existing transaction</SheetDescription>
          </SheetHeader>
          {/* RHFのdefaultValuesは最初にレンダーされた時の値でキャッシュされるので、初期値が準備できるまでレンダーしないようにする */}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <TransactionForm
              id={id}
              defaultValues={defaultValues}
              disabled={isPending}
              accountOptions={accountOptions}
              categoryOptions={categoryOptions}
              onSubmit={onSubmit}
              onDelete={onDelete}
              onCreateAccount={onCreateAccount}
              onCreateCategory={onCreateCategory}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

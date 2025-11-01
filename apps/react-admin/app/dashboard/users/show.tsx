import { DataTable, ReferenceManyField, TextField } from "@/components/admin";
import { DateField } from "@/components/admin/date-field";
import { RecordField } from "@/components/admin/record-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { Show } from "@/components/admin/show";

export const UserShow = () => (
    <Show>
        <div className="flex flex-col gap-4">
            <RecordField source="id" />
            <RecordField source="discordId">
            </RecordField>
            <RecordField source="createdAt">
                <DateField source="createdAt" />
            </RecordField>
            <RecordField source="updatedAt">
                <DateField source="updatedAt" />
            </RecordField>
            <RecordField source="lastInteraction">
                <DateField source="lastInteraction" />
            </RecordField>
            <ReferenceManyField source="discordId" reference="HevyVerification" target="userDiscordId">
                <DataTable bulkActionButtons={false}>
                    <DataTable.Col source="username" />
                    <DataTable.Col source="status" />
                    <DataTable.Col source="createdAt" />
                    <DataTable.Col source="updatedAt" />
                </DataTable>
            </ReferenceManyField>
        </div>
    </Show>
);

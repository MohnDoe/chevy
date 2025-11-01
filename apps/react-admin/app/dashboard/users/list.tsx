import {
    TextField,
    ReferenceManyField,
    SingleFieldList,
} from "@/components/admin";
import { DataTable } from "@/components/admin/data-table";
import { List } from "@/components/admin/list";

export const UserList = () => (
    <List>
        <DataTable>
            <DataTable.Col source="discordId" />
            <DataTable.Col label="Hevy Username">
                <ReferenceManyField
                    source="discordId"
                    reference="HevyVerification"
                    target="userDiscordId"
                >
                    <SingleFieldList>
                        <TextField source="username" />
                    </SingleFieldList>
                </ReferenceManyField>
            </DataTable.Col>
            <DataTable.Col label="Status">
                <ReferenceManyField
                    source="discordId"
                    reference="HevyVerification"
                    target="userDiscordId"
                >
                    <SingleFieldList>
                        <TextField source="status" />
                    </SingleFieldList>
                </ReferenceManyField>
            </DataTable.Col>
            <DataTable.Col source="createdAt" />
            <DataTable.Col source="lastInteraction" />
        </DataTable >
    </List >
);

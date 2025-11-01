import { DataTable, List } from "@/components/admin"

export const ServerList = () => {
    return <List>
        <DataTable>
            <DataTable.Col source="guildId" />
            <DataTable.Col source="createdAt" />
            <DataTable.Col source="updatedAt" />
        </DataTable>
    </List>
}
import {
  DataTable,
  DateField,
  DateInput,
  List,
  ReferenceOneField,
  TextInput,
} from "react-admin";

const filters = [
  <TextInput source="discordId" key={"discordId"} />,
  <DateInput source="createdAt" key={"createdAt"} />,
  <DateInput source="updatedAt" key={"updatedAt"} />,
  <DateInput source="lastInteraction" key={"lastInteraction"} />,
];

export const UserList = () => (
  <List filters={filters}>
    <DataTable>
      <DataTable.Col source="discordId" />
      <DataTable.Col source="Status">
        <ReferenceOneField
          source="discordId"
          target="userDiscordId"
          reference="HevyVerification"
          label="Verified"
          render={(record) => record.referenceRecord?.status}
        />
      </DataTable.Col>
      <DataTable.Col source="createdAt">
        <DateField source="createdAt" />
      </DataTable.Col>
      <DataTable.Col source="updatedAt">
        <DateField source="updatedAt" />
      </DataTable.Col>
      <DataTable.Col source="lastInteraction">
        <DateField source="lastInteraction" />
      </DataTable.Col>
    </DataTable>
  </List>
);

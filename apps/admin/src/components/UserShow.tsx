import {
  DateField,
  ReferenceField,
  ReferenceOneField,
  Show,
  SimpleShowLayout,
  TextField,
} from "react-admin";

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="discordId" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
      <DateField source="lastInteraction" />
      <ReferenceOneField
        source="discordId"
        target="userDiscordId"
        reference="HevyVerification"
        label="Verified"
        render={(record) => record.referenceRecord?.status}
      />
      <ReferenceOneField
        source="discordId"
        target="userDiscordId"
        reference="HevyVerification"
        label="Hevy Username"
        render={(record) => record.referenceRecord?.username}
      />
    </SimpleShowLayout>
  </Show>
);

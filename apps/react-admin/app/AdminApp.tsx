"use client";
import { Resource } from "ra-core";
import { Admin, ListGuesser, ShowGuesser } from "@/components/admin";
import { dataProvider } from "@/lib/dataProvider";
import { authProvider } from "@/lib/authProvider";
import { UserList } from "@/app/dashboard/users/list";

import { LoginPage } from "@/components/admin/login-page";
import { UserShow } from "./dashboard/users/show";
import { ServerList } from "./dashboard/servers/list";

const AdminApp = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    loginPage={LoginPage}
  >
    <Resource name="User" list={UserList} show={UserShow} />
    <Resource name="Share" list={ListGuesser} />
    <Resource name="Server" list={ServerList} />
  </Admin>
);

export default AdminApp;

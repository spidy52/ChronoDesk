import api from '../lib/axios';

/* ================= GET WORKSPACES ================= */

export const fetchWorkspaces =
  async () => {
    const { data } =
      await api.get('/workspaces');

    return data.workspaces;
  };

/* ================= CREATE WORKSPACE ================= */

export const createWorkspace =
  async (workspace: any) => {
    const { data } =
      await api.post(
        '/workspaces',
        workspace
      );

    return data.workspace;
  };

/* ================= UPDATE WORKSPACE ================= */

export const updateWorkspace =
  async (
    id: string,
    updates: any
  ) => {
    const { data } =
      await api.patch(
        `/workspaces/${id}`,
        updates
      );

    return data.workspace;
  };

/* ================= DELETE WORKSPACE ================= */

export const deleteWorkspace =
  async (id: string) => {
    await api.delete(
      `/workspaces/${id}`
    );
  };

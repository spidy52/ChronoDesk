import { create } from 'zustand';

import {
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../services/workspace.service';

interface Workspace {
  _id: string;

  name: string;

  description: string;

  owner: any;

  members: any[];

  isDefault: boolean;
}

interface WorkspaceStore {
  workspaces: Workspace[];

  activeWorkspace: Workspace | null;

  loading: boolean;

  fetchAllWorkspaces: () => Promise<void>;

  setActiveWorkspace: (workspace: Workspace | null) => void;

  addWorkspace: (
    workspace: any
  ) => Promise<void>;

  updateWorkspaceById: (
    id: string,
    updates: any
  ) => Promise<void>;

  deleteWorkspaceById: (
    id: string
  ) => Promise<void>;
}

export const useWorkspaceStore =
  create<WorkspaceStore>(
    (set) => ({
      workspaces: [],

      activeWorkspace: null,

      loading: false,

      /* ================= FETCH ================= */

      fetchAllWorkspaces:
        async () => {
          set({
            loading: true,
          });

          try {
            const workspaces =
              await fetchWorkspaces();

            set({
              workspaces,
            });

            const savedId = localStorage.getItem('activeWorkspaceId');
            if (savedId === 'personal') {
              set({
                activeWorkspace: null,
              });
            } else if (savedId) {
              const matched = workspaces.find((ws: any) => ws._id === savedId);
              if (matched) {
                set({
                  activeWorkspace: matched,
                });
              } else {
                set({
                  activeWorkspace: null,
                });
                localStorage.setItem('activeWorkspaceId', 'personal');
              }
            } else {
              if (workspaces.length > 0) {
                set({
                  activeWorkspace: workspaces[0],
                });
                localStorage.setItem('activeWorkspaceId', workspaces[0]._id);
              } else {
                set({
                  activeWorkspace: null,
                });
                localStorage.setItem('activeWorkspaceId', 'personal');
              }
            }
          } catch (error) {
            console.error(error);
          } finally {
            set({
              loading: false,
            });
          }
        },

      /* ================= SET ACTIVE ================= */

      setActiveWorkspace: (
        workspace
      ) => {
        set({
          activeWorkspace:
            workspace,
        });
        if (workspace === null) {
          localStorage.setItem('activeWorkspaceId', 'personal');
        } else {
          localStorage.setItem('activeWorkspaceId', workspace._id);
        }
      },

      /* ================= CREATE ================= */

      addWorkspace:
        async (workspace) => {
          try {
            const newWorkspace =
              await createWorkspace(
                workspace
              );

            set((state) => ({
              workspaces: [
                newWorkspace,
                ...state.workspaces,
              ],
            }));
          } catch (error) {
            console.error(error);
          }
        },

      /* ================= UPDATE ================= */

      updateWorkspaceById:
        async (
          id,
          updates
        ) => {
          try {
            const updated =
              await updateWorkspace(
                id,
                updates
              );

            set((state) => ({
              workspaces:
                state.workspaces.map(
                  (ws) =>
                    ws._id === id
                      ? updated
                      : ws
                ),

              activeWorkspace:
                state.activeWorkspace?._id ===
                id
                  ? updated
                  : state.activeWorkspace,
            }));
          } catch (error) {
            console.error(error);
          }
        },

      /* ================= DELETE ================= */

      deleteWorkspaceById:
        async (id) => {
          try {
            await deleteWorkspace(
              id
            );

            set((state) => {
              const nextWorkspaces = state.workspaces.filter(
                (ws) => ws._id !== id
              );
              let nextActive = state.activeWorkspace;
              
              if (state.activeWorkspace?._id === id) {
                nextActive = null;
                localStorage.setItem('activeWorkspaceId', 'personal');
              }

              return {
                workspaces: nextWorkspaces,
                activeWorkspace: nextActive,
              };
            });
          } catch (error) {
            console.error(error);
          }
        },
    })
  );

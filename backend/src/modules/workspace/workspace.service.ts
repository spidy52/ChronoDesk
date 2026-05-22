import Workspace from '../../models/Workspace';

/* ================= CREATE ================= */

export const createWorkspaceService =
  async (data: any) => {
    return await Workspace.create(data);
  };

/* ================= GET ================= */

export const getWorkspacesService =
  async (userId: string) => {
    return await Workspace.find({
      $or: [
        { owner: userId },
        { members: userId },
      ],
    }).populate('owner members');
  };

/* ================= GET BY ID ================= */

export const getWorkspaceByIdService =
  async (id: string) => {
    return await Workspace.findById(
      id
    ).populate('owner members');
  };

/* ================= UPDATE ================= */

export const updateWorkspaceService =
  async (
    id: string,
    data: any
  ) => {
    return await Workspace.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
  };

/* ================= DELETE ================= */

export const deleteWorkspaceService =
  async (id: string) => {
    return await Workspace.findByIdAndDelete(
      id
    );
  };

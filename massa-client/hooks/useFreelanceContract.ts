import { useState, useCallback } from "react";
import { useMassaWallet } from "../hooks/useMassaWallet";
import { callContract, readContract } from "../utils/contract";
import { Project, ProjectStatus } from "../types";
import { Address, Args, ArrayTypes } from "@massalabs/massa-web3";

export const useFreelanceContract = () => {
  const { account, connected } = useMassaWallet();
  const [loading, setLoading] = useState(false);

  // ---------------- Create Project ----------------
  const createProject = useCallback(
    async (
      title: string,
      description: string,
      budget: bigint,
      deadline: bigint,
      category: string,
      skills: string[]
    ) => {
      if (!account || !connected) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const params = new Args()
          .addString(title)
          .addString(description)
          .addU64(budget)
          .addU64(deadline)
          .addString(category)
          .addArray(skills, ArrayTypes.STRING);

        skills.forEach((s) => params.addString(s));

        const result = await callContract("createProject", params);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [account, connected]
  );

  // ---------------- Apply for Project ----------------
  const applyForProject = useCallback(
    async (projectId: bigint) => {
      if (!account || !connected) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const params = new Args().addU64(projectId);
        await callContract("applyForProject", params);
      } finally {
        setLoading(false);
      }
    },
    [account, connected]
  );

  // ---------------- Get Project ----------------
  const getProject = useCallback(async (projectId: bigint): Promise<Project> => {
    const params = new Args().addU64(projectId);
    const raw = await readContract("getProjectView", params);
    return parseProject(new Args(raw));
  }, []);

  // ---------------- Get Open Projects ----------------
  const getOpenProjects = useCallback(async (): Promise<Project[]> => {
    const raw = await readContract("getOpenProjects");
    return parseProjectArray(new Args(raw));
  }, []);

  // ---------------- Get Projects by User ----------------
  const getProjectsByUser = useCallback(
    async (userAddress: string): Promise<Project[]> => {
      const params = new Args().addString(userAddress);
      const raw = await readContract("getProjectsByUser", params);
      return parseProjectArray(new Args(raw));
    },
    []
  );

  // ---------------- Helper Parsers ----------------
  const parseProject = (args: Args): Project => {

    return {
      id: args.nextU64(),
      client: args.nextString(),
      freelancer: args.nextString(),
      title: args.nextString(),
      description: args.nextString(),
      budget: args.nextU64(),
      deadline: args.nextU64(),
      status: Number(args.nextU8()) as ProjectStatus,
      createdAt: args.nextU64(),
      category: args.nextString(),
      skills: args.nextArray<string>(ArrayTypes.STRING),
    };
  };

  // Parse an array of Projects
  const parseProjectArray = (args: Args): Project[] => {
    const serializedProjects: Uint8Array[] =
      args.nextArray(ArrayTypes.U8) as unknown as Uint8Array[];

    return serializedProjects.map((bytes) => {
      const projectArgs = new Args(bytes);
      return parseProject(projectArgs);
    });
  };



  return {
    loading,
    createProject,
    applyForProject,
    getProject,
    getOpenProjects,
    getProjectsByUser,
  };
};

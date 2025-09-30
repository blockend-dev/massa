import { useState, useCallback } from "react";
import { useMassaWallet } from "../hooks/useMassaWallet";
import { callContract, readContract } from "../utils/contract";
import { Project } from "../types";
import { Args, ArrayTypes } from "@massalabs/massa-web3";

export const useFreelanceContract = () => {
    const { account, connected } = useMassaWallet();
    const [loading, setLoading] = useState(false);

    // Create Project
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
                // serialize params
                const params = new Args()
                    .addString(title)
                    .addString(description)
                    .addU64(budget)
                    .addU64(deadline)
                    .addString(category)
                    .addArray(skills, ArrayTypes.STRING);

                const result = await callContract("createProject", params);
                return result;
            } finally {
                setLoading(false);
            }
        },
        [account, connected]
    );

    // Apply for project
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

    // View project
    const getProject = useCallback(async (projectId: bigint): Promise<Project> => {
        const params = new Args().addU64(projectId);
        const raw = await readContract("getProjectView", params);
        const args = new Args(raw);

        return parseProject(args);
    }, []);

    // View all open projects
    const getOpenProjects = useCallback(async (): Promise<Project[]> => {
        const raw = await readContract("getOpenProjects");
        const args = new Args(raw);

        return parseProjectArray(args);
    }, []);

    // View projects by user
    const getProjectsByUser = useCallback(
        async (userAddress: string): Promise<Project[]> => {
            const params = new Args().addString(userAddress);
            const raw = await readContract("getProjectsByUser", params);
            const args = new Args(raw);

            return parseProjectArray(args);
        },
        []
    );

    // --- Helper parsing functions ---
    const parseProject = (args: Args): Project => {
        return {
            id: args.nextU64(),
            title: args.nextString(),
            description: args.nextString(),
            budget: args.nextU64(),
            deadline: args.nextU64(),
            category: args.nextString(),
            skills: args.nextArray<string>(ArrayTypes.STRING),
            client: args.nextString(),
            freelancer: args.nextString(),
            status: args.nextString(),
            createdAt: args.nextU64(),
        };
    };

    const parseProjectArray = (args: Args): Project[] => {
        // First, parse the number of projects
        const count = Number(args.nextU64());
        const arr: Project[] = [];
        for (let i = 0; i < count; i++) {
            // For each, we invoke parseProject passing the same `args` (it advances the cursor)
            const proj = parseProject(args);
            arr.push(proj);
        }
        return arr;
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

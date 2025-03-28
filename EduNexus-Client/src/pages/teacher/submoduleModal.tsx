// components/SubmoduleModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    IconButton,
    Flex,
    VStack,
    Box,
    Text,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';

interface SubmoduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSubmodules: Record<string, string>;
    onSubmit: (updatedSubmodules: Record<string, string>) => void;
}

export const SubmoduleModal: React.FC<SubmoduleModalProps> = ({
    isOpen,
    onClose,
    initialSubmodules,
    onSubmit,
}) => {
    const [submodules, setSubmodules] = useState<Record<string, string>>(initialSubmodules);

    useEffect(() => {
        setSubmodules(initialSubmodules);
    }, [initialSubmodules]);

    const handleSubmoduleChange = (key: string, value: string) => {
        setSubmodules((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const addSubmodule = () => {
        const newIndex = Object.keys(submodules).length + 1;
        setSubmodules((prev) => ({
            ...prev,
            [`Submodule ${newIndex}`]: '',
        }));
    };

    const deleteSubmodule = (key: string) => {
        const updatedSubmodules = { ...submodules };
        delete updatedSubmodules[key];
        setSubmodules(updatedSubmodules);
    };

    const moveSubmoduleUp = (index: number) => {
        if (index === 0) return; // Already at the top
        const keys = Object.keys(submodules);
        const newSubmodules = { ...submodules };
        [newSubmodules[keys[index]], newSubmodules[keys[index - 1]]] = [newSubmodules[keys[index - 1]], newSubmodules[keys[index]]];
        setSubmodules(newSubmodules);
    };

    const moveSubmoduleDown = (index: number) => {
        const keys = Object.keys(submodules);
        if (index === keys.length - 1) return; // Already at the bottom
        const newSubmodules = { ...submodules };
        [newSubmodules[keys[index]], newSubmodules[keys[index + 1]]] = [newSubmodules[keys[index + 1]], newSubmodules[keys[index]]];
        setSubmodules(newSubmodules);
    };

    const handleSubmit = () => {
        onSubmit(submodules);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Submodules</ModalHeader>
                <ModalBody>
                    <VStack spacing={4} p={4} height={"400px"} overflow={"auto"}>
                        {Object.keys(submodules).map((key, index) => (
                            <Box key={key} display="flex" alignItems="center" width="100%">
                                <Text mr={4}><b>{index + 1}.</b></Text>
                                <Input
                                    placeholder={`Submodule ${index + 1} value`}
                                    value={submodules[key]}
                                    onChange={(e) => handleSubmoduleChange(key, e.target.value)}
                                />
                                
                                <IconButton
                                    icon={<ChevronUpIcon />}
                                    colorScheme="blue"
                                    size="sm"
                                    ml={2}
                                    onClick={() => moveSubmoduleUp(index)}
                                    aria-label="Move up"
                                />
                                <IconButton
                                    icon={<ChevronDownIcon />}
                                    colorScheme="blue"
                                    size="sm"
                                    ml={2}
                                    onClick={() => moveSubmoduleDown(index)}
                                    aria-label="Move down"
                                />
                                <IconButton
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    size="sm"
                                    ml={2}
                                    onClick={() => deleteSubmodule(key)}
                                    aria-label="Delete submodule"
                                />
                            </Box>
                        ))}
                    </VStack>
                    <Flex justify="center" align="center" width="100%" mt={4}>
                        <Button _focus={{ outline: 'none', boxShadow: 'none' }} leftIcon={<AddIcon />} colorScheme="blue" onClick={addSubmodule}>
                            Add Submodule
                        </Button>
                    </Flex>
                </ModalBody>
                <ModalFooter>
                    <Button _focus={{ outline: 'none', boxShadow: 'none' }} colorScheme="blue" onClick={handleSubmit}>
                        Submit
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

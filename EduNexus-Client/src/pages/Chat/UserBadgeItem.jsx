import React from "react";
import { Box } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const UserBadgeItem = ({ user, handleFunction }) => {
  return (
    <Box
      px={2}
      py={1}
      borderRadius="lg"
      m={1}
      mg={2}
      variant="solid"
      fontsize={12}
      colorscheme="purple"
      cursor="pointer"
      onClick={handleFunction}
      bg="purple"
      color="white"
    >
      {user.name}
      <CloseIcon onClick={handleFunction} pl={2} />
    </Box>
  );
};

export default UserBadgeItem;

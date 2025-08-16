/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import '../App.css'
import { BsCart2 } from "react-icons/bs";
import { HiOutlineBars3 } from "react-icons/hi2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import {Link} from 'react-scroll';
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const menuOptions = [
    {
      text: "Home",
      icon: <HomeIcon />,
    },
    {
      text: "Features",
      icon: <InfoIcon />,
    },
    {
      text: "About",
      icon: <InfoIcon />,
    },
    {
      text: "Work",
      icon: <CommentRoundedIcon />,
    },
    {
      text: "Contact",
      icon: <PhoneRoundedIcon />,
    },
  ];

  return (
    <nav>
      <div className="navbar-brand">
        <h1>ContractAI</h1>
      </div>
      <ul className="navbar-links-container">
        <li>
          <Link to="home" smooth={true} duration={500} offset={-80}>Home</Link>
        </li>
        <li>
          <Link to="features" smooth={true} duration={500} offset={-80}>Features</Link>
        </li>
        <li>
          <Link to="about" smooth={true} duration={500} offset={-80}>About</Link>
        </li>
        <li>
          <Link to="work" smooth={true} duration={500} offset={-80}>Work</Link>
        </li>
        <li>
          <Link to="contact" smooth={true} duration={500} offset={-80}>Contact</Link>
        </li>
      </ul>
      <RouterLink to="/chat" className="primary-button">Get Started</RouterLink>

      <div className="navbar-menu-container">
        <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
      </div>
      <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setOpenMenu(false)}
          onKeyDown={() => setOpenMenu(false)}
        >
          <List>
            {menuOptions.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
    </nav>
  );
};

export default Navbar;
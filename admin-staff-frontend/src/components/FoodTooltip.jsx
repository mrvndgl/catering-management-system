import React from "react";

function FoodTooltip({ product }) {
  return (
    <Tippy
      content={
        <img
          src="https://via.placeholder.com/150"
          alt="Tooltip Image"
          style={{ width: "100px", height: "auto" }}
        />
      }
      allowHTML={true}
      placement="top"
    >
      <button style={{ padding: "10px 20px", fontSize: "16px" }}>
        {product?.name}
      </button>
    </Tippy>
  );
}

export default FoodTooltip;
